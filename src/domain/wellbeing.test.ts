import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { burnoutHint, moodTrend, WELLBEING_NOTE } from './wellbeing'
import type { MoodCheckin } from './types'

const today = '2026-11-10'
const mood = (offset: number, m: 1 | 2 | 3 | 4 | 5): MoodCheckin => ({ id: `m${offset}${m}`, createdAt: 0, updatedAt: 0, localDate: addDays(today, offset), mood: m })
const calmLoad = Array.from({ length: 7 }, (_, i) => ({ date: addDays(today, i), minutes: 30 }))
const heavyLoad = Array.from({ length: 7 }, (_, i) => ({ date: addDays(today, i), minutes: i < 4 ? 200 : 30 }))
const rest = Array.from({ length: 7 }, (_, i) => ({ date: addDays(today, i - 6), schoolMin: i === 3 ? 0 : 40, hobbyMin: 0 }))
const allDays = rest.map((d) => ({ ...d, schoolMin: 40 }))

describe('moodTrend', () => {
  it('averages a day and leaves gaps as null', () => {
    const t = moodTrend([mood(0, 4), mood(0, 2), mood(-2, 5)], today, 4)
    expect(t).toEqual([null, 5, null, 3])
  })
})

describe('burnoutHint', () => {
  const base = { moods: [], load: calmLoad, capacity: () => 120, recent: rest, today }
  it('stays quiet when things look fine', () => { expect(burnoutHint(base)).toBeNull() })

  it('notices low-mood days', () => {
    const h = burnoutHint({ ...base, moods: [mood(0, 1), mood(-1, 2), mood(-3, 2)] })!
    expect(h.signals).toEqual(['you marked 3 of the last 7 days as low'])
    expect(h.message).toContain(WELLBEING_NOTE)
    expect(h.message.startsWith('A small heads up:')).toBe(true)
  })

  it('notices a heavy week ahead and a week with no day off', () => {
    expect(burnoutHint({ ...base, load: heavyLoad })!.signals[0]).toContain('4 of the next 7 days look heavy')
    expect(burnoutHint({ ...base, recent: allDays })!.signals[0]).toContain('no day off')
  })

  it('combines several signals into one message', () => {
    const h = burnoutHint({ ...base, load: heavyLoad, recent: allDays })!
    expect(h.signals).toHaveLength(2)
    expect(h.message.startsWith('A few things add up:')).toBe(true)
  })
})
