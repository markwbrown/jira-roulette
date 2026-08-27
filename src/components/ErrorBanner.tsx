import { JiraApiError } from '../api/client'

export function ErrorBanner({ error }: { error: unknown }) {
  const message =
    error instanceof JiraApiError
      ? `Jira returned HTTP ${error.status}${error.messages.length ? `: ${error.messages.join('; ')}` : ''}`
      : error instanceof Error
        ? error.message
        : 'Something went wrong loading tickets.'
  return (
    <div className="rounded-xl border border-pocket-red/70 bg-pocket-red/15 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ivory-muted">
        Load failed
      </p>
      <p className="mt-2 text-sm text-ivory">{message}</p>
      <p className="mt-2 text-xs text-ivory-muted">
        Check the filters and your .env credentials, then try again.
      </p>
    </div>
  )
}
