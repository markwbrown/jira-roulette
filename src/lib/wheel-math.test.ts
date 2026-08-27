import { describe, expect, it } from 'vitest'
import {
  labelTier,
  midAngle,
  pickWinnerIndex,
  segmentPath,
  targetRotation,
  winnerFromRotation,
} from './wheel-math'

describe('segmentPath', () => {
  it('produces a valid path for various counts', () => {
    for (const n of [2, 3, 8, 37, 100]) {
      for (let i = 0; i < n; i++) {
        const d = segmentPath(i, n)
        expect(d).toMatch(/^M 250 250 L .+ A 240 240 0 [01] 1 .+ Z$/)
      }
    }
  })

  it('uses the large-arc flag only for >180° segments (n=2 edge)', () => {
    expect(segmentPath(0, 2)).toContain(' 0 1 ')
    expect(segmentPath(0, 3)).toContain(' 0 1 ')
  })
})

describe('winner rotation round-trip', () => {
  it('decoding targetRotation always yields the chosen winner', () => {
    for (const n of [1, 2, 3, 7, 24, 61, 137]) {
      for (let trial = 0; trial < 50; trial++) {
        const winner = pickWinnerIndex(n)
        const start = Math.random() * 100_000
        const rotation = targetRotation(start, winner, n)
        expect(rotation).toBeGreaterThan(start)
        expect(winnerFromRotation(rotation, n)).toBe(winner)
      }
    }
  })

  it('rotation is monotonically increasing across consecutive spins', () => {
    let rotation = 0
    for (let i = 0; i < 20; i++) {
      const next = targetRotation(rotation, pickWinnerIndex(12), 12)
      expect(next).toBeGreaterThan(rotation + 360 * 4)
      rotation = next
    }
  })
})

describe('midAngle / labelTier', () => {
  it('centers segments', () => {
    expect(midAngle(0, 4)).toBe(45)
    expect(midAngle(3, 4)).toBe(315)
  })

  it('tiers labels by count', () => {
    expect(labelTier(10)).toBe('full')
    expect(labelTier(40)).toBe('key')
    expect(labelTier(80)).toBe('none')
  })
})
