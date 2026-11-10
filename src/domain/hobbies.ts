import { addDays, DAY_SHORT, startOfWeek, toLocalDate } from './dates'
import { computeStreak, sessionMinutes } from './streaks'
import type { Cadence, Hobby, LocalDate, Log, Pause } from './types'

export function cadenceLabel(c: Cadence): string {
  switch (c.kind) {
    case 'daily': return 'Every day'
    case 'weekdays': return c.days.map((d) => DAY_SHORT[d]).join(' ')
    case 'perWeek': return `${c.times} ${c.times === 1 ? 'time' : 'times'} a week`
    case 'minutesPerWeek': return `${c.minutes} minutes a week`
  }
}

/** A check-in for `now`. The local calendar date comes from the clock's local fields, never from UTC. */
export function makeLog(hobbyId: string, now: Date, extra: { durationMin?: number; note?: string; photoId?: string; metric?: { label: string; value: number }; milestone?: boolean } = {}): Omit<Log, 'id' | 'createdAt' | 'updatedAt'> {
  return { hobbyId, localDate: toLocalDate(now), at: now.getTime(), ...extra }
}

export interface HobbyStats {
  sessions: number
  totalMinutes: number
  weeklyAvgMinutes: number
  bestWeek: { weekStart: LocalDate; minutes: number } | null
  /** Percent of finished periods that met the goal; null when there is nothing to judge yet. */
  consistency: number | null
  timeOfDay: { morning: number; afternoon: number; evening: number; night: number }
}

export function hobbyStats(args: { hobby: Hobby; logs: Log[]; pauses: Pause[]; today: LocalDate; weekStart: 0 | 1 }): HobbyStats {
  const { hobby, today, weekStart } = args
  const mine = args.logs.filter((l) => l.hobbyId === hobby.id && l.localDate <= today)
  const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  const byWeek = new Map<LocalDate, number>()
  let totalMinutes = 0
  for (const l of mine) {
    const m = sessionMinutes(l)
    totalMinutes += m
    const h = new Date(l.at).getHours()
    if (h >= 5 && h < 12) timeOfDay.morning++
    else if (h >= 12 && h < 17) timeOfDay.afternoon++
    else if (h >= 17 && h < 22) timeOfDay.evening++
    else timeOfDay.night++
    const ws = startOfWeek(l.localDate, weekStart)
    byWeek.set(ws, (byWeek.get(ws) ?? 0) + m)
  }
  let bestWeek: HobbyStats['bestWeek'] = null
  for (const [weekStart, minutes] of byWeek) if (!bestWeek || minutes > bestWeek.minutes) bestWeek = { weekStart, minutes }

  let weeklyAvgMinutes = 0
  if (mine.length > 0) {
    const first = mine.reduce((min, l) => (l.localDate < min ? l.localDate : min), mine[0].localDate)
    const weeks = Math.max(1, Math.round((Date.parse(startOfWeek(today, weekStart)) - Date.parse(startOfWeek(first, weekStart))) / (7 * 86400000)) + 1)
    weeklyAvgMinutes = Math.round(totalMinutes / weeks)
  }

  const finished = computeStreak(args).periods.filter((p) => p.status === 'met' || p.status === 'missed').slice(-30)
  const consistency = finished.length === 0 ? null : Math.round((finished.filter((p) => p.status === 'met').length / finished.length) * 100)
  return { sessions: mine.length, totalMinutes, weeklyAvgMinutes, bestWeek, consistency, timeOfDay }
}

/** One calm sentence comparing the last 7 days with the 7 days before. Never scolds. */
export function weeklyReview(name: string, logs: Log[], hobbyId: string, today: LocalDate): string {
  const count = (from: LocalDate, to: LocalDate) => logs.filter((l) => l.hobbyId === hobbyId && l.localDate >= from && l.localDate <= to).length
  const now = count(addDays(today, -6), today)
  const before = count(addDays(today, -13), addDays(today, -7))
  const times = (n: number) => `${n} ${n === 1 ? 'session' : 'sessions'}`
  if (now === 0 && before === 0) return `${name}: no sessions in the last two weeks. Whenever you are ready, one short one is enough.`
  if (now === 0) return `${name}: no sessions in the last 7 days. The 7 days before, you did ${times(before)}. One short session restarts the rhythm.`
  if (now > before) return `${name}: ${times(now)} in the last 7 days, ${now - before} more than the 7 days before.`
  if (now < before) return `${name}: ${times(now)} in the last 7 days, ${before - now} fewer than the 7 days before. A lighter week is fine.`
  return `${name}: ${times(now)} in the last 7 days, the same as the 7 days before.`
}

export interface HeatCell {
  date: LocalDate
  count: number
  minutes: number
}

/** `weeks` columns of 7 days ending with the week that contains `today`, oldest first. Logs from every hobby passed in are summed. */
export function heatCells(logs: Log[], today: LocalDate, weeks: number, weekStart: 0 | 1 = 0): HeatCell[] {
  const start = addDays(startOfWeek(today, weekStart), -(weeks - 1) * 7)
  const byDate = new Map<LocalDate, { count: number; minutes: number }>()
  for (const l of logs) {
    const e = byDate.get(l.localDate) ?? { count: 0, minutes: 0 }
    e.count++
    e.minutes += sessionMinutes(l)
    byDate.set(l.localDate, e)
  }
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, ...(byDate.get(date) ?? { count: 0, minutes: 0 }) }
  })
}

/** 0 for nothing, 1 to 4 for increasing effort. */
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0
  if (minutes < 20) return 1
  if (minutes < 40) return 2
  if (minutes < 70) return 3
  return 4
}
