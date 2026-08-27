import type { TransitionEvent } from 'react'
import {
  BALL_POCKET_CY,
  BALL_RADIUS,
  CX,
  CY,
  R,
  WHEEL_SIZE,
  labelPlacement,
  labelTier,
  segmentPath,
} from '../lib/wheel-math'
import { truncate } from '../lib/adf'
import type { JiraIssue } from '../types/jira'

const POCKET_RED = '#a31621'
const POCKET_BLACK = '#211e1c'
const POCKET_GREEN = '#0e6b45'
const BRASS = '#c9a227'
const IVORY = '#f3ead8'

/**
 * Real roulette alternation: red/black pockets. An odd count would put two
 * reds side by side, so the last pocket becomes the wheel's single green
 * "zero" pocket instead.
 */
function pocketColor(index: number, count: number): string {
  if (count === 1) return POCKET_GREEN
  if (count % 2 === 1 && index === count - 1) return POCKET_GREEN
  return index % 2 === 0 ? POCKET_RED : POCKET_BLACK
}

function labelFor(issue: JiraIssue, count: number): string {
  const tier = labelTier(count)
  if (tier === 'none') return ''
  if (tier === 'key') return issue.key
  const budget = count <= 8 ? 32 : count <= 16 ? 26 : 20
  return truncate(`${issue.key} · ${issue.fields.summary}`, budget)
}

function labelFontSize(count: number): number {
  if (count <= 8) return 13
  if (count <= 16) return 11.5
  if (count <= 24) return 10
  if (count <= 40) return 9.5
  return 8
}

export interface RouletteWheelProps {
  issues: JiraIssue[]
  wheelRotation: number
  ballRotation: number
  spinning: boolean
  spinSeconds: number
  spinId: number
  winnerIndex: number | null
  spinDisabled: boolean
  onSpin: () => void
  onSpinEnd: () => void
}

export function RouletteWheel({
  issues,
  wheelRotation,
  ballRotation,
  spinning,
  spinSeconds,
  spinId,
  winnerIndex,
  spinDisabled,
  onSpin,
  onSpinEnd,
}: RouletteWheelProps) {
  const count = issues.length
  const fontSize = labelFontSize(count)
  const landed = winnerIndex !== null && !spinning

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === 'transform') onSpinEnd()
  }

  const spinEasing = 'cubic-bezier(0.12, 0, 0.05, 1)'

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] select-none">
      <div
        className="h-full w-full"
        style={{
          transform: `rotate(${wheelRotation}deg)`,
          transition: spinning ? `transform ${spinSeconds}s ${spinEasing}` : undefined,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} className="h-full w-full">
          {/* backing disc + brass rim */}
          <circle cx={CX} cy={CY} r={R + 8} fill={POCKET_BLACK} />
          <circle cx={CX} cy={CY} r={R + 5} fill="none" stroke={BRASS} strokeWidth={6} />

          {count === 1 ? (
            <circle cx={CX} cy={CY} r={R} fill={POCKET_GREEN} />
          ) : (
            issues.map((issue, i) => {
              const isWinner = landed && i === winnerIndex
              const dimmed = landed && i !== winnerIndex
              return (
                <path
                  key={issue.id}
                  d={segmentPath(i, count)}
                  fill={pocketColor(i, count)}
                  stroke={isWinner ? '#e8c55a' : BRASS}
                  strokeWidth={isWinner ? 3 : 1}
                  strokeOpacity={isWinner ? 1 : 0.55}
                  fillOpacity={dimmed ? 0.3 : 1}
                  className={isWinner ? 'winner-glow' : undefined}
                >
                  <title>{`${issue.key} — ${issue.fields.summary}`}</title>
                </path>
              )
            })
          )}

          {labelTier(count) !== 'none' &&
            issues.map((issue, i) => {
              if (count === 1) {
                return (
                  <text
                    key={issue.id}
                    x={CX}
                    y={CY - 60}
                    textAnchor="middle"
                    fill={IVORY}
                    fontSize={14}
                    fontFamily="var(--font-mono)"
                    fontWeight={600}
                  >
                    {issue.key}
                  </text>
                )
              }
              const { x, y, rotate } = labelPlacement(i, count)
              const dimmed = landed && i !== winnerIndex
              return (
                <text
                  key={issue.id}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${rotate} ${x} ${y})`}
                  fill={IVORY}
                  fillOpacity={dimmed ? 0.3 : 0.95}
                  fontSize={fontSize}
                  fontFamily="var(--font-mono)"
                  fontWeight={500}
                  pointerEvents="none"
                >
                  {labelFor(issue, count)}
                </text>
              )
            })}
        </svg>
      </div>

      {/* the ball: orbits counter-clockwise on its own overlay, independent of
          the wheel's rotation, then falls from the rim track into a pocket */}
      <svg
        viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      >
        <g
          style={{
            transform: `rotate(${ballRotation}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: spinning ? `transform ${spinSeconds}s ${spinEasing}` : undefined,
          }}
        >
          <circle
            key={spinId}
            cx={CX}
            cy={BALL_POCKET_CY}
            r={BALL_RADIUS}
            fill="#f6efdf"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={1}
            className={spinId > 0 ? 'ball-run' : undefined}
            style={{
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))',
              ['--spin-duration' as string]: `${spinSeconds}s`,
            }}
          />
        </g>
      </svg>

      {/* hub doubles as the spin control */}
      <button
        type="button"
        onClick={onSpin}
        disabled={spinDisabled}
        className={
          'absolute left-1/2 top-1/2 z-10 aspect-square w-[26%] -translate-x-1/2 -translate-y-1/2 ' +
          'rounded-full border-4 border-brass bg-felt-deep font-display text-2xl font-black ' +
          'tracking-widest text-brass-bright shadow-[inset_0_2px_12px_rgba(0,0,0,0.7)] ' +
          'transition-transform hover:enabled:scale-105 active:enabled:scale-95 ' +
          'disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {spinning ? '···' : 'SPIN'}
      </button>
    </div>
  )
}
