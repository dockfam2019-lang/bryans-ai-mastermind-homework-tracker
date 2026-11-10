import { describe, expect, it } from 'vitest'
import { DEFAULT_POMODORO, formatClock, minutesToLog, nextPhase, phaseMinutes, remainingMs } from './pomodoro'

describe('pomodoro', () => {
  it('uses 25, 5 and 15 minute phases by default', () => {
    expect([phaseMinutes('focus'), phaseMinutes('short'), phaseMinutes('long')]).toEqual([25, 5, 15])
  })

  it('takes a long break after every fourth focus session', () => {
    expect([1, 2, 3, 4, 5, 8].map((n) => nextPhase('focus', n))).toEqual(['short', 'short', 'short', 'long', 'short', 'long'])
    expect(nextPhase('short', 1)).toBe('focus')
    expect(nextPhase('long', 4)).toBe('focus')
    expect(nextPhase('focus', 2, { ...DEFAULT_POMODORO, longEvery: 2 })).toBe('long')
  })

  it('counts down from a wall-clock end time and never goes negative', () => {
    expect(remainingMs(10_000, 4_000)).toBe(6_000)
    expect(remainingMs(10_000, 12_000)).toBe(0)
  })

  it('formats the clock, rounding partial seconds up', () => {
    expect(formatClock(25 * 60000)).toBe('25:00')
    expect(formatClock(59_001)).toBe('1:00')
    expect(formatClock(61_000)).toBe('1:01')
    expect(formatClock(0)).toBe('0:00')
  })

  it('logs elapsed minutes, at least one, capped at the planned length', () => {
    expect(minutesToLog(0, 25 * 60000, 25)).toBe(25)
    expect(minutesToLog(0, 20_000, 25)).toBe(1)
    expect(minutesToLog(0, 40 * 60000, 25)).toBe(25)
    expect(minutesToLog(5, 5, 25)).toBe(0)
  })
})
