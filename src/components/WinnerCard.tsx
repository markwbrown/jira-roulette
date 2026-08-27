import { useState } from 'react'
import { adfToPlainText, truncate } from '../lib/adf'
import type { JiraIssue, JiraUser } from '../types/jira'
import { AssigneePicker } from './AssigneePicker'

function browseUrl(issue: JiraIssue): string {
  try {
    return `${new URL(issue.self).origin}/browse/${issue.key}`
  } catch {
    return `#${issue.key}`
  }
}

function statusPillClass(issue: JiraIssue): string {
  switch (issue.fields.status.statusCategory?.key) {
    case 'done':
      return 'border-pocket-green text-emerald-300'
    case 'indeterminate':
      return 'border-brass/60 text-brass-bright'
    default:
      return 'border-ivory-muted/50 text-ivory-muted'
  }
}

export function WinnerCard({
  issue,
  projectKey,
}: {
  issue: JiraIssue
  projectKey: string
}) {
  const [assignee, setAssignee] = useState<JiraUser | null>(issue.fields.assignee)
  const blurb = truncate(adfToPlainText(issue.fields.description), 220)

  return (
    <div className="rounded-xl border border-brass/50 bg-felt-deep/70 p-6 shadow-[0_0_30px_rgba(232,197,90,0.08)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass">
        The wheel has chosen
      </p>

      <div className="mt-3 flex items-baseline gap-3">
        <a
          href={browseUrl(issue)}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-sm font-semibold text-brass-bright underline underline-offset-4 hover:text-ivory"
        >
          {issue.key}
        </a>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusPillClass(issue)}`}
        >
          {issue.fields.status.name}
        </span>
      </div>

      <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-ivory">
        {issue.fields.summary}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-ivory-muted">
        {blurb || '(no description)'}
      </p>

      {issue.fields.parent && (
        <p className="mt-3 text-xs text-ivory-muted">
          Epic:{' '}
          <span className="font-mono text-ivory">
            {issue.fields.parent.key}
            {issue.fields.parent.fields?.summary
              ? ` — ${issue.fields.parent.fields.summary}`
              : ''}
          </span>
        </p>
      )}

      <div className="mt-5 border-t border-felt-edge/60 pt-4">
        <p className="text-xs text-ivory-muted">
          Assignee:{' '}
          <span className="font-medium text-ivory">
            {assignee ? assignee.displayName : 'Unassigned'}
          </span>
        </p>
        <AssigneePicker
          issueKey={issue.key}
          projectKey={projectKey}
          currentAssignee={assignee}
          onAssigned={setAssignee}
        />
      </div>
    </div>
  )
}
