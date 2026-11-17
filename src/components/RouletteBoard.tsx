import { useEffect, useRef } from 'react'
import { truncate } from '../lib/adf'
import { boardNumber, pocketKind, type PocketKind } from '../lib/wheel-math'
import type { JiraIssue } from '../types/jira'

const CELL_BG: Record<PocketKind, string> = {
  red: 'bg-pocket-red',
  black: 'bg-pocket-black',
  green: 'bg-pocket-green',
}

function Dolly() {
  return (
    <span className="dolly-drop pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ivory bg-brass-bright shadow-[0_3px_8px_rgba(0,0,0,0.65)]">
      <span className="h-2.5 w-2.5 rounded-full bg-felt-deep/80" />
    </span>
  )
}

interface CellProps {
  issue: JiraIssue
  index: number
  count: number
  isWinner: boolean
  dimmed: boolean
  showKey: boolean
  winnerRef: React.MutableRefObject<HTMLDivElement | null>
  gridRow?: string
}

function Cell({ issue, index, count, isWinner, dimmed, showKey, winnerRef, gridRow }: CellProps) {
  const kind = pocketKind(index, count)
  return (
    <div
      ref={isWinner ? winnerRef : undefined}
      style={gridRow ? { gridRow } : undefined}
      title={`${issue.key} — ${issue.fields.summary}`}
      className={
        `relative flex min-h-11 flex-col items-center justify-center rounded-[3px] border px-1 py-1 ${CELL_BG[kind]} ` +
        (isWinner
          ? 'winner-glow z-10 border-brass-bright '
          : 'border-ivory/35 ') +
        (dimmed ? 'opacity-40' : '')
      }
    >
      <span className="font-mono text-sm font-bold leading-none text-ivory">
        {boardNumber(index, count)}
      </span>
      {showKey && (
        <span className="mt-1 max-w-full truncate font-mono text-[9px] leading-none text-ivory/75">
          {issue.key}
        </span>
      )}
      {isWinner && <Dolly />}
    </div>
  )
}

export interface RouletteBoardProps {
  issues: JiraIssue[]
  /** Index of the landed pocket — pass null while idle or spinning. */
  winnerIndex: number | null
}

/**
 * The betting table: the wheel's pockets laid out as a classic roulette
 * board — green 0 on the left, then the numbered cells in three rows,
 * running 1,2,3 bottom-to-top per column like the real layout. When the
 * ball lands, the dolly goes on the winning number and the ticket is
 * called out beneath the table.
 */
export function RouletteBoard({ issues, winnerIndex }: RouletteBoardProps) {
  const count = issues.length
  const winnerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (winnerIndex !== null) {
      winnerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [winnerIndex])

  if (count === 0) return null

  const hasZero = count === 1 || count % 2 === 1
  const numberedCount = hasZero ? count - 1 : count
  const showKey = count <= 24
  const winner = winnerIndex !== null ? issues[winnerIndex] : null

  // Column-major, 3 per column, rendered top row first (3-2-1 per column,
  // like the real table reads bottom-to-top).
  const columns: number[][] = []
  for (let c = 0; c * 3 < numberedCount; c++) {
    const col: number[] = []
    for (let r = 2; r >= 0; r--) {
      const i = c * 3 + r
      if (i < numberedCount) col.push(i)
    }
    columns.push(col)
  }

  return (
    <div className="mt-6">
      <div className="overflow-x-auto pb-2">
        <div
          className="grid w-max min-w-full gap-[3px] rounded-md border-2 border-ivory/40 bg-felt-deep/50 p-[3px]"
          style={{
            gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(2.9rem, 1fr)',
          }}
        >
          {hasZero && (
            <Cell
              issue={issues[count - 1]}
              index={count - 1}
              count={count}
              isWinner={winnerIndex === count - 1}
              dimmed={winner !== null && winnerIndex !== count - 1}
              showKey={showKey}
              winnerRef={winnerRef}
              gridRow="1 / span 3"
            />
          )}
          {columns.flat().map((i) => (
            <Cell
              key={issues[i].id}
              issue={issues[i]}
              index={i}
              count={count}
              isWinner={winnerIndex === i}
              dimmed={winner !== null && winnerIndex !== i}
              showKey={showKey}
              winnerRef={winnerRef}
            />
          ))}
        </div>
      </div>

      {winner && winnerIndex !== null && (
        <p className="mt-2 text-sm text-ivory-muted">
          <span className="font-mono font-semibold text-brass-bright">
            No. {boardNumber(winnerIndex, count)}
          </span>{' '}
          — <span className="font-mono text-ivory">{winner.key}</span>:{' '}
          {truncate(winner.fields.summary, 80)}
        </p>
      )}
    </div>
  )
}
