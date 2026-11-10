import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { computeStreak, freezesLeft, weekProgress } from './streaks'
import type { Hobby, Log, Pause } from './types'

const hobby = (cadence: Hobby['cadence']): Hobby => ({ id: 'h', name: 'Guitar', icon: 'g', color: '#fff', cadence, createdAt: 0, updatedAt: 0 })
const log = (localDate: string, over: Partial<Log> = {}): Log => ({ id: localDate + (over.id ?? ''), createdAt: 0, updatedAt: 0, hobbyId: 'h', localDate, at: 0, ...over })
const days = (...offsets: number[]) => offsets.map((o) => log(addDays('2026-11-01', o)))
const daily = hobby({ kind: 'daily' })
const run = (logs: Log[], today: string, h = daily, pauses: Pause[] = [], weekStart: 0 | 1 = 0) => computeStreak({ hobby: h, logs, pauses, today, weekStart })

describe('daily streaks and the two-day rule', () => {
  it('counts consecutive days, with today still open until it is logged', () => {
    const r = run(days(0, 1, 2), '2026-11-04')
    expect(r.current).toBe(3)
    expect(r.periods.at(-1)?.status).toBe('open')
    expect(run(days(0, 1, 2, 3), '2026-11-04').current).toBe(4)
  })

  it('treats one missed day as data: the streak survives', () => {
    // logged Nov 1, 2, 4 (missed Nov 3), today is Nov 5 and open
    const r = run(days(0, 1, 3), '2026-11-05')
    expect(r.current).toBe(3)
    expect(r.atRisk).toBe(false)
  })

  it('ends the streak after two missed days in a row', () => {
    // logged Nov 1, 2, then nothing on Nov 3 and 4; today is Nov 5, open
    const r = run(days(0, 1), '2026-11-05')
    expect(r.current).toBe(0)
    expect(r.best).toBe(2)
  })

  it('flags a streak at risk when yesterday was missed and today is open', () => {
    const r = run(days(0, 1, 2), '2026-11-05') // Nov 3 logged, Nov 4 missed, Nov 5 open
    expect(r.current).toBe(3)
    expect(r.atRisk).toBe(true)
    expect(run(days(0, 1, 2, 4), '2026-11-05').atRisk).toBe(false)
  })

  it('keeps the best streak after a break and starts a new run', () => {
    const r = run(days(0, 1, 2, 3, 4, 7, 8), '2026-11-09') // 5 days, 2 missed, 2 more
    expect(r.best).toBe(5)
    expect(r.current).toBe(2)
  })

  it('has no streak without logs, and ignores logs in the future or for other hobbies', () => {
    expect(run([], '2026-11-05')).toMatchObject({ current: 0, best: 0, periods: [] })
    expect(run([log('2026-11-09')], '2026-11-05').current).toBe(0)
    expect(run([log('2026-11-05', { hobbyId: 'other' })], '2026-11-05').current).toBe(0)
  })

  it('counts several logs on one day once', () => {
    expect(run([log('2026-11-04', { id: 'a' }), log('2026-11-04', { id: 'b' })], '2026-11-04').current).toBe(1)
  })
})

describe('pauses and freezes', () => {
  it('skips paused days so they neither count nor break the streak', () => {
    const pause: Pause = { id: 'p', createdAt: 0, updatedAt: 0, hobbyId: 'h', kind: 'pause', start: '2026-11-03', end: '2026-11-06' }
    const r = run(days(0, 1, 7), '2026-11-08', daily, [pause])
    expect(r.current).toBe(3)
  })

  it('a hobby-specific or all-hobby pause both apply, but not another hobby\'s pause', () => {
    const all: Pause = { id: 'p', createdAt: 0, updatedAt: 0, hobbyId: '*', kind: 'pause', start: '2026-11-03', end: '2026-11-06' }
    const other: Pause = { ...all, hobbyId: 'x' }
    expect(run(days(0, 1, 7), '2026-11-08', daily, [all]).current).toBe(3)
    expect(run(days(0, 1, 7), '2026-11-08', daily, [other]).current).toBe(1)
  })

  it('a freeze forgives a single missed day', () => {
    const freeze: Pause = { id: 'f', createdAt: 0, updatedAt: 0, hobbyId: 'h', kind: 'freeze', start: '2026-11-03', end: '2026-11-04' }
    expect(run(days(0, 1, 4), '2026-11-06', daily, [freeze]).current).toBe(3)
  })

  it('limits freezes to two per 30 days', () => {
    const f = (start: string): Pause => ({ id: start, createdAt: 0, updatedAt: 0, hobbyId: 'h', kind: 'freeze', start })
    expect(freezesLeft([], '2026-11-10')).toEqual({ used: 0, left: 2 })
    expect(freezesLeft([f('2026-11-05')], '2026-11-10')).toEqual({ used: 1, left: 1 })
    expect(freezesLeft([f('2026-11-05'), f('2026-10-20')], '2026-11-10').left).toBe(0)
    expect(freezesLeft([f('2026-10-01'), f('2026-10-05')], '2026-11-10').left).toBe(2) // older than 30 days
  })
})

describe('specific weekdays', () => {
  const mwf = hobby({ kind: 'weekdays', days: [1, 3, 5] }) // Mon Wed Fri

  it('does not count off-days as misses', () => {
    // Nov 2 2026 is a Monday. Logged Mon, Wed, Fri; Tue and Thu are not expected.
    const r = run([log('2026-11-02'), log('2026-11-04'), log('2026-11-06')], '2026-11-07', mwf)
    expect(r.current).toBe(3)
  })

  it('breaks after two missed scheduled days', () => {
    const r = run([log('2026-11-02')], '2026-11-09', mwf) // missed Wed, Fri, then Mon is today (open)
    expect(r.current).toBe(0)
  })
})

describe('weekly cadences', () => {
  const four = hobby({ kind: 'perWeek', times: 2 })

  it('counts consecutive weeks that reach the goal, with the current week open', () => {
    // week of Nov 1 (Sun start): 2 logs, week of Nov 8: 2 logs, week of Nov 15 (today) 1 log so far
    const logs = [log('2026-11-02'), log('2026-11-04'), log('2026-11-09'), log('2026-11-11'), log('2026-11-16')]
    const r = run(logs, '2026-11-17', four)
    expect(r.unit).toBe('week')
    expect(r.current).toBe(2)
    expect(r.periods.at(-1)?.status).toBe('open')
  })

  it('survives one short week and breaks after two', () => {
    const base = [log('2026-11-02'), log('2026-11-04')] // met week 1
    const oneShort = [...base, log('2026-11-09'), log('2026-11-16'), log('2026-11-18')] // week 2 short (1), week 3 met
    expect(run(oneShort, '2026-11-19', four).current).toBe(2)
    const twoShort = [...base, log('2026-11-23'), log('2026-11-25')] // weeks 2 and 3 empty, week 4 met
    expect(run(twoShort, '2026-11-26', four).current).toBe(1)
  })

  it('counts minutes toward a minutes-per-week goal, using the default for check-ins without a duration', () => {
    const m = hobby({ kind: 'minutesPerWeek', minutes: 60 })
    const week = [log('2026-11-02', { durationMin: 30 }), log('2026-11-04', { durationMin: 40 })]
    expect(run(week, '2026-11-15', m).periods[0].status).toBe('met')
    expect(run([log('2026-11-02'), log('2026-11-03'), log('2026-11-04')], '2026-11-15', m).periods[0].status).toBe('met') // 3 x 20
    expect(run([log('2026-11-02'), log('2026-11-03')], '2026-11-15', m).periods[0].status).toBe('missed') // 2 x 20 = 40
  })

  it('skips a week that is mostly paused', () => {
    const pause: Pause = { id: 'p', createdAt: 0, updatedAt: 0, hobbyId: 'h', kind: 'pause', start: '2026-11-08', end: '2026-11-14' }
    const r = run([log('2026-11-02'), log('2026-11-04'), log('2026-11-16'), log('2026-11-17')], '2026-11-18', four, [pause])
    expect(r.periods.map((p) => p.status)).toEqual(['met', 'skipped', 'met'])
    expect(r.current).toBe(2)
  })

  it('respects a Monday week start', () => {
    // Sunday Nov 8 belongs to the week starting Monday Nov 2 when weeks start on Monday
    const logs = [log('2026-11-02'), log('2026-11-08')]
    expect(run(logs, '2026-11-09', four, [], 1).periods[0].status).toBe('met')
    expect(run(logs, '2026-11-09', four, [], 0).periods[0].status).not.toBe('met')
  })
})

describe('date edge cases', () => {
  it('counts across the DST change on 2026-11-01 without losing or doubling a day', () => {
    const logs = ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'].map((d) => log(d))
    expect(run(logs, '2026-11-03').current).toBe(4)
  })

  it('uses the stored local date and ignores the timestamp, so travel across time zones changes nothing', () => {
    // timestamps are deliberately inconsistent with the local dates
    const logs = [log('2026-11-02', { at: Date.UTC(2026, 10, 3, 4) }), log('2026-11-03', { at: Date.UTC(2026, 10, 3, 1) }), log('2026-11-04', { at: 0 })]
    expect(run(logs, '2026-11-05').current).toBe(3)
  })
})

describe('weekProgress', () => {
  const logs = [log('2026-11-09', { durationMin: 30 }), log('2026-11-10', { durationMin: 45 }), log('2026-11-14')]
  it('reports sessions, minutes and days for the current week', () => {
    expect(weekProgress(hobby({ kind: 'perWeek', times: 4 }), logs, '2026-11-11', 0)).toEqual({ value: 3, target: 4, unit: 'sessions' })
    expect(weekProgress(hobby({ kind: 'minutesPerWeek', minutes: 120 }), logs, '2026-11-11', 0)).toEqual({ value: 95, target: 120, unit: 'minutes' })
    expect(weekProgress(hobby({ kind: 'weekdays', days: [1, 3, 5] }), logs, '2026-11-11', 0)).toEqual({ value: 3, target: 3, unit: 'days' })
    expect(weekProgress(daily, logs, '2026-11-11', 0)).toEqual({ value: 3, target: 7, unit: 'days' })
  })
})
