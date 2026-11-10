import { describe, expect, it } from 'vitest'
import { addDays, diffDays, dueAt, formatCountdown, formatTime, relativeDay, startOfWeek, toLocalDate, weekDates, weekday } from './dates'

describe('local dates', () => {
  it('formats a Date as a local calendar day, including late-evening edges', () => {
    expect(toLocalDate(new Date(2026, 10, 10, 23, 59, 59))).toBe('2026-11-10')
    expect(toLocalDate(new Date(2026, 10, 10, 0, 0, 0))).toBe('2026-11-10')
  })

  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('adds and diffs days across US DST changes without shifting the date', () => {
    // US DST ends 2026-11-01 and starts 2026-03-08
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02')
    expect(diffDays('2026-10-31', '2026-11-02')).toBe(2)
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09')
    expect(diffDays('2026-03-07', '2026-03-09')).toBe(2)
  })

  it('diffs days both directions and returns zero for the same day', () => {
    expect(diffDays('2026-11-10', '2026-11-13')).toBe(3)
    expect(diffDays('2026-11-13', '2026-11-10')).toBe(-3)
    expect(diffDays('2026-11-10', '2026-11-10')).toBe(0)
  })

  it('finds the start of a week for Sunday and Monday week starts', () => {
    expect(weekday('2026-11-10')).toBe(2) // Tuesday
    expect(startOfWeek('2026-11-10', 0)).toBe('2026-11-08')
    expect(startOfWeek('2026-11-10', 1)).toBe('2026-11-09')
    expect(startOfWeek('2026-11-08', 1)).toBe('2026-11-02')
    expect(weekDates('2026-11-10', 1)).toHaveLength(7)
  })

  it('builds due dates with a default end-of-day time', () => {
    const d = dueAt('2026-11-10', '14:10')
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(10)
    expect(dueAt('2026-11-10').getHours()).toBe(23)
  })

  it('formats times and relative days', () => {
    expect(formatTime('14:10')).toBe('2:10 pm')
    expect(formatTime('09:00')).toBe('9 am')
    expect(formatTime('00:30')).toBe('12:30 am')
    expect(relativeDay('2026-11-10', '2026-11-10')).toBe('Today')
    expect(relativeDay('2026-11-11', '2026-11-10')).toBe('Tomorrow')
    expect(relativeDay('2026-11-13', '2026-11-10')).toBe('Fri')
    expect(relativeDay('2026-11-25', '2026-11-10')).toBe('Nov 25')
  })

  it('formats countdowns', () => {
    expect(formatCountdown(-1)).toBe('overdue')
    expect(formatCountdown(45 * 60000)).toBe('45m')
    expect(formatCountdown((2 * 60 + 10) * 60000)).toBe('2h 10m')
    expect(formatCountdown(3 * 86400000)).toBe('3d')
  })
})
