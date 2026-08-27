export const WHEEL_SIZE = 500
export const CX = WHEEL_SIZE / 2
export const CY = WHEEL_SIZE / 2
export const R = 240

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

/**
 * The wheel is rotated clockwise by `rotation` degrees, and the pointer sits at
 * 12 o'clock (angle 0). A segment point at initial angle `a` ends up at
 * `(a + rotation) mod 360`, so the winner lands under the pointer when
 * `rotation ≡ -winnerMid (mod 360)`.
 */
export function targetRotation(
  currentRotation: number,
  winnerIndex: number,
  count: number,
): number {
  const segment = 360 / count
  const jitter = (randFloat() - 0.5) * segment * 0.8
  const winnerMid = midAngle(winnerIndex, count) + jitter
  const desired = ((360 - (winnerMid % 360)) % 360 + 360) % 360
  const fullSpins = 4 + Math.floor(randFloat() * 3) // 4–6 full turns
  const current = ((currentRotation % 360) + 360) % 360
  let delta = desired - current
  if (delta <= 0) delta += 360
  return currentRotation + fullSpins * 360 + delta
}

/** Inverse of targetRotation: which segment index sits under the pointer. */
export function winnerFromRotation(rotation: number, count: number): number {
  const pointerAngle = ((360 - (rotation % 360)) % 360 + 360) % 360
  return Math.floor(pointerAngle / (360 / count)) % count
}

export type LabelTier = 'full' | 'key' | 'none'

export function labelTier(count: number): LabelTier {
  if (count <= 24) return 'full'
  if (count <= 60) return 'key'
  return 'none'
}
