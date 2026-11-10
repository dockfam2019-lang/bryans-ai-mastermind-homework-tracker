import { describe, expect, it } from 'vitest'
import { absencesLeft, onTimeStreak, recentByType, summarizeOnTime } from './attendance'
import type { Attendance } from './types'

const rec = (localDate: string, status: Attendance['status'], eventType: Attendance['eventType'] = 'devotional'): Attendance => ({
  id: localDate + eventType, createdAt: 0, updatedAt: 0, eventType, localDate, status,
})

describe('attendance', () => {
  it('summarizes on-time rate', () => {
    const s = summarizeOnTime([rec('2026-11-02', 'on-time'), rec('2026-11-03', 'late'), rec('2026-11-04', 'on-time'), rec('2026-11-05', 'absent')])
    expect(s).toMatchObject({ onTime: 2, late: 1, absent: 1, total: 4, pct: 50 })
  })

  it('returns a null percentage with no records', () => {
    expect(summarizeOnTime([]).pct).toBeNull()
  })

  it('returns the most recent records of a type, oldest first', () => {
    const rows = [rec('2026-11-05', 'on-time'), rec('2026-11-03', 'late'), rec('2026-11-04', 'on-time', 'school'), rec('2026-11-04', 'on-time')]
    expect(recentByType(rows, 'devotional', 2).map((r) => r.localDate)).toEqual(['2026-11-04', '2026-11-05'])
  })

  it('counts absences left without going negative', () => {
    expect(absencesLeft([rec('a', 'absent'), rec('b', 'absent')], 3)).toBe(1)
    expect(absencesLeft([rec('a', 'absent'), rec('b', 'absent')], 1)).toBe(0)
  })
})

describe('onTimeStreak', () => {
  it('counts on-time days and tolerates one late day but not two in a row', () => {
    const rows = [rec('2026-11-02', 'on-time'), rec('2026-11-03', 'on-time'), rec('2026-11-04', 'late'), rec('2026-11-05', 'on-time'), rec('2026-11-06', 'on-time')]
    expect(onTimeStreak(rows, 'devotional')).toBe(4)
    const broken = [rec('2026-11-02', 'on-time'), rec('2026-11-03', 'late'), rec('2026-11-04', 'absent'), rec('2026-11-05', 'on-time')]
    expect(onTimeStreak(broken, 'devotional')).toBe(1)
  })
  it('only looks at the chosen event type and returns zero with no records', () => {
    expect(onTimeStreak([rec('2026-11-02', 'on-time', 'school')], 'devotional')).toBe(0)
    expect(onTimeStreak([], 'school')).toBe(0)
  })
})

