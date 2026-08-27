import { useState } from 'react'
import { JiraApiError } from '../api/client'
import { useAssignMutation, useAssignableUsers } from '../hooks/useJira'
import type { JiraUser } from '../types/jira'

export function AssigneePicker({
  issueKey,
  projectKey,
  currentAssignee,
  onAssigned,
}: {
  issueKey: string
  projectKey: string
  currentAssignee: JiraUser | null
  onAssigned: (user: JiraUser | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const users = useAssignableUsers(projectKey, query)
  const mutation = useAssignMutation()

  const assign = (user: JiraUser | null) => {
    mutation.mutate(
      { issueKey, accountId: user?.accountId ?? null },
      {
        onSuccess: () => {
          onAssigned(user)
          setOpen(false)
        },
      },
    )
  }

  const errorMessage =
    mutation.error instanceof JiraApiError
      ? mutation.error.messages.join('; ') ||
        `Jira refused the assignment (HTTP ${mutation.error.status}).`
      : mutation.error instanceof Error
        ? mutation.error.message
        : null

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-brass bg-brass/10 px-4 py-2 text-sm font-semibold text-brass-bright transition-colors hover:bg-brass/20"
        >
          {currentAssignee ? 'Reassign to…' : 'Assign to…'}
        </button>
      ) : (
        <div className="rounded-lg border border-felt-edge bg-felt p-3">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-md border border-felt-edge bg-felt-deep px-3 py-1.5 text-sm text-ivory placeholder:text-ivory-muted/60"
          />
          <ul className="mt-2 max-h-52 space-y-0.5 overflow-y-auto">
            {users.isLoading && (
              <li className="px-2 py-1.5 text-sm text-ivory-muted">Loading…</li>
            )}
            {users.data?.length === 0 && (
              <li className="px-2 py-1.5 text-sm text-ivory-muted">
                No assignable people found.
              </li>
            )}
            {users.data?.map((user) => (
              <li key={user.accountId}>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => assign(user)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm text-ivory transition-colors hover:bg-felt-edge/50 disabled:opacity-50"
                >
                  {user.displayName}
                  {user.accountId === currentAssignee?.accountId && (
                    <span className="ml-2 text-xs text-ivory-muted">(current)</span>
                  )}
                </button>
              </li>
            ))}
            {currentAssignee && (
              <li>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => assign(null)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm text-ivory-muted transition-colors hover:bg-felt-edge/50 disabled:opacity-50"
                >
                  Unassign
                </button>
              </li>
            )}
          </ul>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                mutation.reset()
              }}
              className="text-xs text-ivory-muted underline underline-offset-2 hover:text-ivory"
            >
              Cancel
            </button>
            {mutation.isPending && (
              <span className="text-xs text-ivory-muted">Assigning…</span>
            )}
          </div>
          {errorMessage && (
            <p className="mt-2 text-xs text-red-300">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}
