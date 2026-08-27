export const WHEEL_SIZE = 500
export const CX = WHEEL_SIZE / 2
export const CY = WHEEL_SIZE / 2
export const R = 240

/** Ball geometry, in SVG user units. The radial path during a spin (outer
 * apron → inward spiral → pocket) lives in the ball-run keyframes in index.css. */
export const BALL_RADIUS = 9
export const BALL_POCKET_CY = CY - 207 // at rest: settled into a pocket

/** Angles are degrees measured clockwise from 12 o'clock. */
function polar(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}

export function segmentPath(index: number, count: number): string {
  const start = (360 / count) * index
  const end = (360 / count) * (index + 1)
  const [x1, y1] = polar(start, R)
  const [x2, y2] = polar(end, R)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

export function midAngle(index: number, count: number): number {
  return (360 / count) * (index + 0.5)
}

export interface LabelPlacement {
  x: number
  y: number
  rotate: number
  flipped: boolean
}

export function labelPlacement(index: number, count: number, radius = 150): LabelPlacement {
  const angle = midAngle(index, count)
  const [x, y] = polar(angle, radius)
  const flipped = angle > 180
  // Text runs along the radial line; flip on the left half so it's never upside down.
  const rotate = flipped ? angle + 90 : angle - 90
  return { x, y, rotate, flipped }
}

function randFloat(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

export function pickWinnerIndex(count: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % count
}

const mod360 = (deg: number): number => ((deg % 360) + 360) % 360

export interface SpinTargets {
  wheelRotation: number
  ballRotation: number
}

/**
 * Real-roulette kinematics: the wheel spins clockwise to an ARBITRARY final
 * rotation, while the ball races counter-clockwise around the rim. Both are
 * solved so that when they stop together, the ball's absolute angle coincides
 * with the winning pocket's final absolute angle:
 *
 *   ballRotation ≡ pocketMid + wheelRotation  (mod 360)
 *
 * A pocket at wheel-frame angle `a` ends up at absolute angle `a + wheelRotation`,
 * so the ball (whose absolute angle IS its rotation) must stop there.
 */
export function spinTargets(
  currentWheelRotation: number,
  currentBallRotation: number,
  winnerIndex: number,
  count: number,
): SpinTargets {
  const segment = 360 / count
  // the wheel stops wherever it likes — no pointer to line up with any more
  const wheelRotation =
    currentWheelRotation + (4 + Math.floor(randFloat() * 3)) * 360 + randFloat() * 360

  // land the ball inside the winner's pocket, off-center by a little jitter
  const jitter = (randFloat() - 0.5) * segment * 0.7
  const pocketAbsolute = mod360(midAngle(winnerIndex, count) + jitter + wheelRotation)

  // ball travels the OPPOSITE direction: 6–8 full turns, then the remainder
  // needed to stop exactly on the pocket
  let remainder = mod360(currentBallRotation - pocketAbsolute)
  if (remainder === 0) remainder = 360
  const ballRotation =
    currentBallRotation - (6 + Math.floor(randFloat() * 3)) * 360 - remainder

  return { wheelRotation, ballRotation }
}

/** Inverse of spinTargets: which pocket the ball is resting in. */
export function winnerFromSpin(
  wheelRotation: number,
  ballRotation: number,
  count: number,
): number {
  const pocketAngle = mod360(ballRotation - wheelRotation)
  return Math.floor(pocketAngle / (360 / count)) % count
}

export type LabelTier = 'full' | 'key' | 'none'

export function labelTier(count: number): LabelTier {
  if (count <= 24) return 'full'
  if (count <= 60) return 'key'
  return 'none'
}
