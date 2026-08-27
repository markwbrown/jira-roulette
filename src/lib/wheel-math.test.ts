import { describe, expect, it } from 'vitest'
import {
  labelTier,
  midAngle,
  pickWinnerIndex,
  segmentPath,
  spinTargets,
  winnerFromSpin,
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

describe('wheel + ball spin round-trip', () => {
  it('the ball always stops in the chosen winner pocket', () => {
    for (const n of [1, 2, 3, 7, 24, 61, 137]) {
      for (let trial = 0; trial < 50; trial++) {
        const winner = pickWinnerIndex(n)
        const startWheel = Math.random() * 100_000
        const startBall = -Math.random() * 100_000
        const { wheelRotation, ballRotation } = spinTargets(startWheel, startBall, winner, n)
        expect(winnerFromSpin(wheelRotation, ballRotation, n)).toBe(winner)
      }
    }
  })

  it('wheel and ball travel in opposite directions, several turns each', () => {
    let wheel = 0
    let ball = 0
    for (let i = 0; i < 20; i++) {
      const targets = spinTargets(wheel, ball, pickWinnerIndex(12), 12)
      expect(targets.wheelRotation).toBeGreaterThan(wheel + 360 * 4)
      expect(targets.ballRotation).toBeLessThan(ball - 360 * 6)
      wheel = targets.wheelRotation
      ball = targets.ballRotation
    }
  })

  it('wheel final rotation is unconstrained (varies mod 360)', () => {
    const finals = new Set<number>()
    for (let i = 0; i < 30; i++) {
      const { wheelRotation } = spinTargets(0, 0, 0, 10)
      finals.add(Math.round(((wheelRotation % 360) + 360) % 360 / 36))
    }
    // with 30 samples across 10 buckets, an actually-random stop position
    // should hit well more than one bucket
    expect(finals.size).toBeGreaterThan(3)
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
