import { describe, expect, it } from 'vitest'
import { cadenceLabel, heatCells, heatLevel, hobbyStats, makeLog, weeklyReview } from './hobbies'
import type { Hobby, Log } from './types'

const hobby: Hobby = { id: 'h', name: 'Guitar', icon: 'g', color: '#fff', cadence: { kind: 'perWeek', times: 2 }, createdAt: 0, updatedAt: 0 }
const log = (localDate: string, over: Partial<Log> = {}): Log => ({ id: localDate + (over.id ?? ''), createdAt: 0, updatedAt: 0, hobbyId: 'h', localDate, at: new Date(`${localDate}T09:00:00`).getTime(), ...over })

describe('cadenceLabel', () => {
  it('describes each cadence', () => {
    expect(cadenceLabel({ kind: 'daily' })).toBe('Every day')
    expect(cadenceLabel({ kind: 'weekdays', days: [1, 3, 5] })).toBe('Mon Wed Fri')
    expect(cadenceLabel({ kind: 'perWeek', times: 1 })).toBe('1 time a week')
    expect(cadenceLabel({ kind: 'perWeek', times: 4 })).toBe('4 times a week')
    expect(cadenceLabel({ kind: 'minutesPerWeek', minutes: 150 })).toBe('150 minutes a week')
  })
})

describe('makeLog and midnight edges', () => {
  it('uses the local date at 23:59:59 and at 00:00:00', () => {
    expect(makeLog('h', new Date(2026, 10, 10, 23, 59, 59)).localDate).toBe('2026-11-10')
    expect(makeLog('h', new Date(2026, 10, 11, 0, 0, 0)).localDate).toBe('2026-11-11')
  })
  it('keeps the timestamp and optional fields', () => {
    const now = new Date(2026, 10, 10, 8, 30)
    expect(makeLog('h', now, { durationMin: 25, note: 'scales' })).toMatchObject({ hobbyId: 'h', at: now.getTime(), durationMin: 25, note: 'scales' })
  })
  it('gives the right local date on the day clocks change', () => {
    expect(makeLog('h', new Date(2026, 10, 1, 1, 30)).localDate).toBe('2026-11-01') // US DST ends
    expect(makeLog('h', new Date(2026, 2, 8, 3, 30)).localDate).toBe('2026-03-08') // US DST starts
  })
})

describe('hobbyStats', () => {
  const logs = [
    log('2026-11-02', { durationMin: 30, at: new Date(2026, 10, 2, 7, 0).getTime() }),
    log('2026-11-04', { durationMin: 45, at: new Date(2026, 10, 4, 14, 0).getTime() }),
    log('2026-11-09', { durationMin: 20, at: new Date(2026, 10, 9, 19, 0).getTime() }),
    log('2026-11-10', { durationMin: 20, at: new Date(2026, 10, 10, 23, 30).getTime() }),
  ]
  const stats = hobbyStats({ hobby, logs, pauses: [], today: '2026-11-11', weekStart: 0 })

  it('totals sessions and minutes and averages by week', () => {
    expect(stats.sessions).toBe(4)
    expect(stats.totalMinutes).toBe(115)
    expect(stats.weeklyAvgMinutes).toBe(58) // 115 over 2 weeks, rounded
  })
  it('finds the best week', () => {
    expect(stats.bestWeek).toEqual({ weekStart: '2026-11-01', minutes: 75 })
  })
  it('counts the time of day from the check-in time', () => {
    expect(stats.timeOfDay).toEqual({ morning: 1, afternoon: 1, evening: 1, night: 1 })
  })
  it('reports consistency over finished periods and null when there is nothing finished', () => {
    expect(stats.consistency).toBe(100) // week of Nov 1 met (2 sessions); Nov 8 is still open
    expect(hobbyStats({ hobby, logs: [], pauses: [], today: '2026-11-11', weekStart: 0 }).consistency).toBeNull()
    expect(hobbyStats({ hobby, logs: [], pauses: [], today: '2026-11-11', weekStart: 0 }).bestWeek).toBeNull()
  })
})

describe('weeklyReview', () => {
  const mk = (...dates: string[]) => dates.map((d) => log(d))
  it('says how this week compares to the one before, kindly', () => {
    // the last 7 days (Nov 5 to 11) hold 6 logs; the 7 days before (Oct 29 to Nov 4) hold none
    const logs = mk('2026-11-05', '2026-11-06', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11')
    expect(weeklyReview('Guitar', logs, 'h', '2026-11-11')).toBe('Guitar: 6 sessions this week, 6 more than the week before.')
  })
  it('handles fewer, equal, zero this week and nothing at all', () => {
    const base = mk('2026-10-30', '2026-10-31', '2026-11-01') // previous window: 3
    expect(weeklyReview('Guitar', [...base, ...mk('2026-11-06')], 'h', '2026-11-11')).toBe('Guitar: 1 session this week, 2 fewer than the week before. A lighter week is fine.')
    expect(weeklyReview('Guitar', [...base, ...mk('2026-11-06', '2026-11-07', '2026-11-08')], 'h', '2026-11-11')).toBe('Guitar: 3 sessions this week, the same as the week before.')
    expect(weeklyReview('Guitar', base, 'h', '2026-11-11')).toContain('no sessions this week')
    expect(weeklyReview('Guitar', [], 'h', '2026-11-11')).toContain('no sessions in the last two weeks')
  })
})

describe('heat map', () => {
  it('builds whole weeks ending with the current one and sums logs per day', () => {
    const cells = heatCells([log('2026-11-10', { durationMin: 30 }), log('2026-11-10', { id: 'b', durationMin: 15 })], '2026-11-10', 3, 0)
    expect(cells).toHaveLength(21)
    expect(cells[0].date).toBe('2026-10-25') // Sunday two weeks before the current week's Sunday
    const day = cells.find((c) => c.date === '2026-11-10')!
    expect(day).toMatchObject({ count: 2, minutes: 45 })
    expect(cells.at(-1)?.date).toBe('2026-11-14')
  })
  it('maps minutes to levels', () => {
    expect([0, 10, 20, 39, 40, 69, 70, 200].map(heatLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4])
  })
})
