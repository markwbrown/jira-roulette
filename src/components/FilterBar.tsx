import type { Dispatch, ReactNode } from 'react'
import { useEpics, useProjects, useSprints } from '../hooks/useJira'
import type { FilterAction } from '../lib/filters'
import type { Filters } from '../types/jira'
import { StatusFilter } from './StatusFilter'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-ivory-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

const selectClass =
  'w-full truncate rounded-lg border border-felt-edge bg-felt-deep px-3 py-2 text-sm ' +
  'text-ivory disabled:cursor-not-allowed disabled:opacity-40'

export function FilterBar({
  filters,
  dispatch,
}: {
  filters: Filters
  dispatch: Dispatch<FilterAction>
}) {
  const projects = useProjects()
  const epics = useEpics(filters.projectKey)
  const sprints = useSprints(filters.projectKey)

  const hasEpics = (epics.data?.length ?? 0) > 0
  const hasSprints = (sprints.data?.length ?? 0) > 0

  return (
    <section className="mt-6 rounded-xl border border-felt-edge bg-felt-deep/40 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Project">
          <select
            className={selectClass}
            value={filters.projectKey ?? ''}
            onChange={(e) =>
              dispatch({ type: 'set-project', projectKey: e.target.value || null })
            }
          >
            <option value="">
              {projects.isLoading
                ? 'Loading projects…'
                : projects.isError
                  ? 'Failed to load projects'
                  : 'Choose a project'}
            </option>
            {projects.data?.map((p) => (
              <option key={p.id} value={p.key}>
                {p.key} — {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Epic">
          <select
            className={selectClass}
            value={filters.epicKey ?? ''}
            disabled={!filters.projectKey || !hasEpics}
            onChange={(e) =>
              dispatch({ type: 'set-epic', epicKey: e.target.value || null })
            }
          >
            <option value="">
              {!filters.projectKey
                ? '—'
                : epics.isLoading
                  ? 'Loading epics…'
                  : hasEpics
                    ? 'All epics'
                    : 'No epics in this project'}
            </option>
            {epics.data?.map((epic) => (
              <option key={epic.key} value={epic.key}>
                {epic.key} — {epic.fields.summary}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Sprint">
          <select
            className={selectClass}
            value={filters.sprintId ?? ''}
            disabled={!filters.projectKey || !hasSprints}
            onChange={(e) =>
              dispatch({
                type: 'set-sprint',
                sprintId: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">
              {!filters.projectKey
                ? '—'
                : sprints.isLoading
                  ? 'Loading sprints…'
                  : hasSprints
                    ? 'All sprints'
                    : 'No scrum board in this project'}
            </option>
            {sprints.data?.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
                {sprint.state === 'active' ? ' (active)' : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <StatusFilter filters={filters} dispatch={dispatch} />
    </section>
  )
}
