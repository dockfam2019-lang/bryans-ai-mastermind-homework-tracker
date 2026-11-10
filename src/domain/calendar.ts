import { addDays, fromLocalDate, startOfWeek } from './dates'
import type { LocalDate } from './types'

/** Weeks (rows of 7 dates) covering the month containing `date`, padded with neighbouring days. */
export function monthGrid(date: LocalDate, weekStart: 0 | 1 = 0): LocalDate[][] {
  const d = fromLocalDate(date)
  const first: LocalDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const last = addDays(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - 1)
  const weeks: LocalDate[][] = []
  let cursor = startOfWeek(first, weekStart)
  while (cursor <= last) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)))
    cursor = addDays(cursor, 7)
  }
  return weeks
}

export function sameMonth(a: LocalDate, b: LocalDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** First day of the month `delta` months from `date`. */
export function shiftMonth(date: LocalDate, delta: number): LocalDate {
  const d = fromLocalDate(date)
  const t = new Date(d.getFullYear(), d.getMonth() + delta, 1)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`
}
