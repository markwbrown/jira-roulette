import { useState, type Dispatch } from 'react'
import { useProjectStatuses } from '../hooks/useJira'
import type { FilterAction } from '../lib/filters'
import type { Filters, ProjectStatus, StatusMode } from '../types/jira'

const MODES: Array<{ mode: Exclude<StatusMode, 'custom'>; label: string }> = [
  { mode: 'not-done', label: 'Not done' },
  { mode: 'todo', label: 'To do' },
  { mode: 'in-progress', label: 'In progress' },
  { mode: 'all', label: 'All' },
]

const CATEGORY_LABELS: Record<ProjectStatus['categoryKey'], string> = {
  new: 'To do',
  indeterminate: 'In progress',
  done: 'Done',
  other: 'Other',
}

const CATEGORY_ORDER: Array<ProjectStatus['categoryKey']> = [
  'new',
  'indeterminate',
  'done',
  'other',
]

export function StatusFilter({
  filters,
  dispatch,
}: {
  filters: Filters
  dispatch: Dispatch<FilterAction>
}) {
  const [refineOpen, setRefineOpen] = useState(false)
  const statuses = useProjectStatuses(filters.projectKey)

  if (!filters.projectKey) return null

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    statuses: (statuses.data ?? []).filter((s) => s.categoryKey === category),
  })).filter((group) => group.statuses.length > 0)

  return (
    <div className="mt-4 border-t border-felt-edge/60 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-ivory-muted">
          Status
        </span>
        {MODES.map(({ mode, label }) => {
          const active = filters.statusMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => dispatch({ type: 'set-status-mode', mode })}
              className={
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
                (active
                  ? 'border-brass bg-brass/15 text-brass-bright'
                  : 'border-felt-edge text-ivory-muted hover:border-brass/60 hover:text-ivory')
              }
            >
              {label}
            </button>
          )
        })}
        {(statuses.data?.length ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => setRefineOpen((open) => !open)}
            className={
              'ml-auto rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
              (filters.statusMode === 'custom'
                ? 'border-brass bg-brass/15 text-brass-bright'
                : 'border-felt-edge text-ivory-muted hover:border-brass/60 hover:text-ivory')
            }
          >
            {refineOpen ? 'Hide statuses' : 'Refine statuses'}
            {filters.statusMode === 'custom' ? ` (${filters.statusNames.length})` : ''}
          </button>
        )}
      </div>

      {refineOpen && (
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ivory-muted">
                {CATEGORY_LABELS[group.category]}
              </p>
              <ul className="mt-1.5 space-y-1">
                {group.statuses.map((status) => (
                  <li key={status.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ivory">
                      <input
                        type="checkbox"
                        className="accent-[#c9a227]"
                        checked={filters.statusNames.includes(status.name)}
                        onChange={() =>
                          dispatch({ type: 'toggle-status', name: status.name })
                        }
                      />
                      {status.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
