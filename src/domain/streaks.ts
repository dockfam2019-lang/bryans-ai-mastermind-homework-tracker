// Forgiving streaks.
//
// A hobby is judged period by period: each day for "daily" and "specific weekdays" cadences,
// each calendar week for "N times a week" and "X minutes a week".
//   met      the goal for that period was reached (any logged day counts as met for day cadences)
//   missed   the period is over and the goal was not reached
//   skipped  nothing was expected (a non-scheduled weekday) or the period was paused or frozen
//   open     the current period, still in progress; never counts against you
//
// Two-day rule: one missed period is just data and does not end a streak. Two missed periods
// in a row (skipped periods in between do not reset the count) do. Dates are local YYYY-MM-DD
// strings, so travel, DST changes and midnight never move a day.
import { addDays, startOfWeek, weekday } from './dates'
import type { Hobby, LocalDate, Log, Pause } from './types'

export const DEFAULT_SESSION_MINUTES = 20 // used when a check-in has no duration and the goal is in minutes
export const MAX_FREEZES_PER_30_DAYS = 2
const WEEK_PAUSED_DAYS = 4 // a week with this many paused days is skipped

export type PeriodStatus = 'met' | 'missed' | 'skipped' | 'open'

export interface Period {
  start: LocalDate
  end: LocalDate
  status: PeriodStatus
}

export interface StreakResult {
  unit: 'day' | 'week'
  current: number
  best: number
  periods: Period[]
  /** The most recent finished period was missed and the current one is still open: one more miss ends the streak. */
  atRisk: boolean
}

export const isWeeklyCadence = (h: Hobby) => h.cadence.kind === 'perWeek' || h.cadence.kind === 'minutesPerWeek'

export function isPaused(date: LocalDate, hobbyId: string, pauses: Pause[]): boolean {
  return pauses.some((p) => (p.hobbyId === '*' || p.hobbyId === hobbyId) && date >= p.start && (p.end === undefined || date <= p.end))
}

export function sessionMinutes(l: Log): number {
  return l.durationMin ?? DEFAULT_SESSION_MINUTES
}

export function computeStreak(args: { hobby: Hobby; logs: Log[]; pauses: Pause[]; today: LocalDate; weekStart: 0 | 1 }): StreakResult {
  const { hobby, pauses, today, weekStart } = args
  const mine = args.logs.filter((l) => l.hobbyId === hobby.id && l.localDate <= today)
  const unit = isWeeklyCadence(hobby) ? 'week' : 'day'
  if (mine.length === 0) return { unit, current: 0, best: 0, periods: [], atRisk: false }

  const first = mine.reduce((min, l) => (l.localDate < min ? l.localDate : min), mine[0].localDate)
  const periods: Period[] = []

  if (unit === 'day') {
    const logged = new Set(mine.map((l) => l.localDate))
    const expected = (d: LocalDate) => hobby.cadence.kind !== 'weekdays' || hobby.cadence.days.includes(weekday(d))
    for (let d = first; d <= today; d = addDays(d, 1)) {
      let status: PeriodStatus
      if (logged.has(d)) status = 'met'
      else if (!expected(d) || isPaused(d, hobby.id, pauses)) status = 'skipped'
      else if (d === today) status = 'open'
      else status = 'missed'
      periods.push({ start: d, end: d, status })
    }
  } else {
    const currentWeek = startOfWeek(today, weekStart)
    for (let ws = startOfWeek(first, weekStart); ws <= currentWeek; ws = addDays(ws, 7)) {
      const we = addDays(ws, 6)
      const inWeek = mine.filter((l) => l.localDate >= ws && l.localDate <= we)
      const value = hobby.cadence.kind === 'minutesPerWeek' ? inWeek.reduce((s, l) => s + sessionMinutes(l), 0) : inWeek.length
      const target = hobby.cadence.kind === 'minutesPerWeek' ? hobby.cadence.minutes : hobby.cadence.kind === 'perWeek' ? hobby.cadence.times : 1
      let pausedDays = 0
      for (let i = 0; i < 7; i++) if (isPaused(addDays(ws, i), hobby.id, pauses)) pausedDays++
      let status: PeriodStatus
      if (value >= target) status = 'met'
      else if (pausedDays >= WEEK_PAUSED_DAYS) status = 'skipped'
      else if (ws === currentWeek) status = 'open'
      else status = 'missed'
      periods.push({ start: ws, end: we, status })
    }
  }

  // current streak: walk back from the latest period
  let current = 0
  let misses = 0
  for (let i = periods.length - 1; i >= 0; i--) {
    const s = periods[i].status
    if (s === 'open' || s === 'skipped') continue
    if (s === 'met') { current++; misses = 0 }
    else if (++misses >= 2) break
  }
  // best streak: walk forward with the same rule
  let best = 0
  let run = 0
  misses = 0
  for (const p of periods) {
    if (p.status === 'open' || p.status === 'skipped') continue
    if (p.status === 'met') { run++; misses = 0; best = Math.max(best, run) }
    else if (++misses >= 2) { run = 0; misses = 0 }
  }

  const closed = periods.filter((p) => p.status !== 'skipped')
  const last = periods[periods.length - 1]
  const lastClosed = [...closed].reverse().find((p) => p.status !== 'open')
  const atRisk = last.status === 'open' && lastClosed?.status === 'missed'

  return { unit, current, best, periods, atRisk }
}

/** Freezes used in the 30 days up to and including `today`, and how many are left. */
export function freezesLeft(pauses: Pause[], today: LocalDate): { used: number; left: number } {
  const since = addDays(today, -29)
  const used = pauses.filter((p) => p.kind === 'freeze' && p.start >= since && p.start <= today).length
  return { used, left: Math.max(0, MAX_FREEZES_PER_30_DAYS - used) }
}

export interface Progress {
  value: number
  target: number
  unit: 'sessions' | 'minutes' | 'days'
}

/** How far along the current week is. */
export function weekProgress(hobby: Hobby, logs: Log[], today: LocalDate, weekStart: 0 | 1): Progress {
  const ws = startOfWeek(today, weekStart)
  const we = addDays(ws, 6)
  const inWeek = logs.filter((l) => l.hobbyId === hobby.id && l.localDate >= ws && l.localDate <= we)
  switch (hobby.cadence.kind) {
    case 'perWeek': return { value: inWeek.length, target: hobby.cadence.times, unit: 'sessions' }
    case 'minutesPerWeek': return { value: inWeek.reduce((s, l) => s + sessionMinutes(l), 0), target: hobby.cadence.minutes, unit: 'minutes' }
    case 'weekdays': return { value: new Set(inWeek.map((l) => l.localDate)).size, target: hobby.cadence.days.length, unit: 'days' }
    default: return { value: new Set(inWeek.map((l) => l.localDate)).size, target: 7, unit: 'days' }
  }
}
