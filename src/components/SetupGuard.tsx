import type { ReactNode } from 'react'
import { mockEnabled } from '../api/mock'
import { JiraApiError } from '../api/client'
import { useMyself } from '../hooks/useJira'

export function SetupGuard({ children }: { children: ReactNode }) {
  const myself = useMyself()

  if (mockEnabled) return <>{children}</>

  if (myself.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-ivory-muted">
          Connecting to Jira…
        </p>
      </div>
    )
  }

  if (myself.isError) {
    const status =
      myself.error instanceof JiraApiError ? myself.error.status : null
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-xl border border-felt-edge bg-felt-deep/70 p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass">
            Table closed
          </p>
          <h1 className="mt-1 font-display text-3xl font-black text-ivory">
            Connect your Jira
          </h1>
          <p className="mt-3 text-sm text-ivory-muted">
            {status === 401 || status === 403
              ? `Jira rejected the credentials (HTTP ${status}).`
              : status != null
                ? `The Jira proxy responded with HTTP ${status} — it is likely not configured yet.`
                : 'Could not reach the Jira proxy.'}
          </p>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ivory">
            <li>
              Copy <code className="font-mono text-brass-bright">.env.example</code> to{' '}
              <code className="font-mono text-brass-bright">.env</code> in the project root.
            </li>
            <li>
              Set <code className="font-mono text-brass-bright">JIRA_BASE_URL</code>,{' '}
              <code className="font-mono text-brass-bright">JIRA_EMAIL</code>, and an API token
              from{' '}
              <a
                className="text-brass-bright underline underline-offset-2"
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
              >
                id.atlassian.com
              </a>
              .
            </li>
            <li>
              Restart <code className="font-mono text-brass-bright">npm run dev</code>.
            </li>
          </ol>
          <p className="mt-5 text-xs text-ivory-muted">
            No Jira handy? Preview the wheel with{' '}
            <a className="text-brass-bright underline underline-offset-2" href="/?mock=1">
              mock data
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
