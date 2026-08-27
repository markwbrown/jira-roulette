import { useEffect, useReducer, useRef } from 'react'
import { pickWinnerIndex, spinTargets } from '../lib/wheel-math'
import type { JiraIssue } from '../types/jira'
import { EmptyState } from './EmptyState'
import { ErrorBanner } from './ErrorBanner'
import { RouletteWheel } from './RouletteWheel'
import { ISSUE_FETCH_CAP } from '../api/issues'

interface SpinState {
  phase: 'idle' | 'spinning' | 'landed'
  wheelRotation: number
  ballRotation: number
  winnerIndex: number | null
  snapshot: JiraIssue[] | null
  spinId: number
}

type SpinAction =
  | {
      type: 'spin'
      wheelRotation: number
      ballRotation: number
      winnerIndex: number
      snapshot: JiraIssue[]
    }
  | { type: 'landed' }
  | { type: 'reset' }

function spinReducer(state: SpinState, action: SpinAction): SpinState {
  switch (action.type) {
    case 'spin':
      return {
        phase: 'spinning',
        wheelRotation: action.wheelRotation,
        ballRotation: action.ballRotation,
        winnerIndex: action.winnerIndex,
        snapshot: action.snapshot,
        spinId: state.spinId + 1,
      }
    case 'landed':
      return { ...state, phase: 'landed' }
    case 'reset':
      // keep the accumulated rotations so wheel and ball never jump
      return { ...state, phase: 'idle', winnerIndex: null, snapshot: null }
  }
}

export interface WheelPanelProps {
  issues: JiraIssue[]
  truncated: boolean
  approxTotal: number | undefined
  loading: boolean
  error: unknown
  onWinner: (issue: JiraIssue) => void
}

export function WheelPanel({
  issues,
  truncated,
  approxTotal,
  loading,
  error,
  onWinner,
}: WheelPanelProps) {
  const [spin, dispatch] = useReducer(spinReducer, {
    phase: 'idle',
    wheelRotation: 0,
    ballRotation: 0,
    winnerIndex: null,
    snapshot: null,
    spinId: 0,
  })

  // new issue data invalidates a finished round (but never interrupts a live spin)
  const prevIssues = useRef(issues)
  useEffect(() => {
    if (prevIssues.current !== issues) {
      prevIssues.current = issues
      if (spin.phase !== 'spinning') dispatch({ type: 'reset' })
    }
  }, [issues, spin.phase])

  const wheelIssues = spin.snapshot ?? issues
  const count = wheelIssues.length

  const handleSpin = () => {
    if (spin.phase === 'spinning' || issues.length === 0) return
    const winnerIndex = pickWinnerIndex(issues.length)
    const { wheelRotation, ballRotation } = spinTargets(
      spin.wheelRotation,
      spin.ballRotation,
      winnerIndex,
      issues.length,
    )
    dispatch({ type: 'spin', wheelRotation, ballRotation, winnerIndex, snapshot: issues })
  }

  const handleSpinEnd = () => {
    if (spin.phase !== 'spinning') return
    dispatch({ type: 'landed' })
    if (spin.winnerIndex !== null && spin.snapshot) {
      onWinner(spin.snapshot[spin.winnerIndex])
    }
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const spinSeconds = prefersReducedMotion ? 0.6 : 4.5

  if (error != null) {
    return <ErrorBanner error={error} />
  }

  if (loading) {
    return (
      <div className="flex aspect-square w-full max-w-[560px] items-center justify-center justify-self-center">
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-ivory-muted">
          Dealing tickets…
        </p>
      </div>
    )
  }

  if (issues.length === 0 && spin.snapshot === null) {
    return <EmptyState />
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ivory-muted">
          <span className="font-mono font-semibold text-ivory">{count}</span>{' '}
          ticket{count === 1 ? '' : 's'} on the wheel
        </p>
        {truncated && (
          <p className="rounded-full border border-brass/40 px-3 py-1 text-xs text-brass-bright">
            Showing the first {ISSUE_FETCH_CAP}
            {approxTotal != null ? ` of ~${approxTotal}` : ''} — narrow the
            filters for a fair wheel
          </p>
        )}
      </div>
      <RouletteWheel
        issues={wheelIssues}
        wheelRotation={spin.wheelRotation}
        ballRotation={spin.ballRotation}
        spinning={spin.phase === 'spinning'}
        spinSeconds={spinSeconds}
        spinId={spin.spinId}
        winnerIndex={spin.winnerIndex}
        spinDisabled={spin.phase === 'spinning' || issues.length === 0}
        onSpin={handleSpin}
        onSpinEnd={handleSpinEnd}
      />
    </div>
  )
}
