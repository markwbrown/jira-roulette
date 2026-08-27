import { useEffect, useReducer, useState } from 'react'
import { mockEnabled } from './api/mock'
import { FilterBar } from './components/FilterBar'
import { SetupGuard } from './components/SetupGuard'
import { WheelPanel } from './components/WheelPanel'
import { WinnerCard } from './components/WinnerCard'
import { useIssues } from './hooks/useJira'
import { filtersReducer, initialFilters } from './lib/filters'
import type { JiraIssue } from './types/jira'

export default function App() {
  const [filters, dispatch] = useReducer(filtersReducer, initialFilters)
  const [winner, setWinner] = useState<JiraIssue | null>(null)
  const issuesQuery = useIssues(filters)

  // a new filter combination deals a new table — clear the previous winner
  useEffect(() => {
    setWinner(null)
  }, [filters])

  return (
    <SetupGuard>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-brass">
              The backlog casino
            </p>
            <h1 className="font-display text-4xl font-black tracking-tight text-ivory">
              Jira Roulette
            </h1>
          </div>
          {mockEnabled && (
            <span className="rounded-full border border-brass/50 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-brass">
              Mock mode
            </span>
          )}
        </header>

        <FilterBar filters={filters} dispatch={dispatch} />

        {filters.projectKey === null ? (
          <div className="mt-16 text-center">
            <p className="font-display text-2xl font-semibold text-ivory-muted">
              Pick a project to open the table.
            </p>
          </div>
        ) : (
          <main className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <WheelPanel
              issues={issuesQuery.data?.issues ?? []}
              truncated={issuesQuery.data?.truncated ?? false}
              approxTotal={issuesQuery.data?.approxTotal}
              loading={issuesQuery.isLoading}
              error={issuesQuery.error}
              onWinner={setWinner}
            />
            <aside className="lg:sticky lg:top-8">
              {winner ? (
                <WinnerCard
                  key={winner.key}
                  issue={winner}
                  projectKey={filters.projectKey}
                />
              ) : (
                <div className="rounded-xl border border-felt-edge bg-felt-deep/60 p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ivory-muted">
                    No winner yet
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ivory-muted">
                    Spin the wheel to let the house pick the next ticket. The
                    winner lands here with its details and an assign action.
                  </p>
                </div>
              )}
            </aside>
          </main>
        )}
      </div>
    </SetupGuard>
  )
}
