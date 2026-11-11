// Date helpers. Everything works on local calendar dates (YYYY-MM-DD) so DST changes,
// travel and midnight edges never shift a day. Arithmetic uses the local Date constructor
// (month/day overflow handled by the engine) or UTC components for day differences.
import type { LocalDate, TimeOfDay } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromLocalDate(s: LocalDate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: LocalDate, n: number): LocalDate {
  const [y, m, d] = s.split('-').map(Number)
  return toLocalDate(new Date(y, m - 1, d + n))
}

/** Whole calendar days from a to b (positive when b is later). DST-safe. */
export function diffDays(a: LocalDate, b: LocalDate): number {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
}

export function weekday(s: LocalDate): number {
  return fromLocalDate(s).getDay()
}

export function startOfWeek(s: LocalDate, weekStart: 0 | 1 = 0): LocalDate {
  const offset = (weekday(s) - weekStart + 7) % 7
  return addDays(s, -offset)
}

export function weekDates(s: LocalDate, weekStart: 0 | 1 = 0): LocalDate[] {
  const start = startOfWeek(s, weekStart)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function dueAt(date: LocalDate, time?: TimeOfDay): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = (time ?? '23:59').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function formatTime(time: TimeOfDay): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hh} ${suffix}` : `${hh}:${pad(m)} ${suffix}`
}

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Today", "Tomorrow", "Fri", or "Nov 18" relative to `today`. */
export function relativeDay(date: LocalDate, today: LocalDate): string {
  const n = diffDays(today, date)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1 && n < 7) return DAY_SHORT[weekday(date)]
  const d = fromLocalDate(date)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

/** "2h 10m", "45m", "3d" style countdown. Negative values return "overdue". */
export function formatCountdown(ms: number): string {
  if (ms < 0) return 'overdue'
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  return `${Math.floor(hours / 24)}d`
}

/** "in 45 minutes", "in 3 hours", "tomorrow", "in 2 days", or "overdue". */
export function countdownWords(ms: number): string {
  if (ms < 0) return 'overdue'
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `in ${mins} ${mins === 1 ? 'minute' : 'minutes'}`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  const days = Math.round(hours / 24)
  return days === 1 ? 'in 1 day' : `in ${days} days`
}

/** One duration format everywhere: "45m", "2h", "8h 48m". */
export function formatHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  if (h === 0) return `${m}m`
  return m % 60 === 0 ? `${h}h` : `${h}h ${m % 60}m`
}

/** Minutes since midnight for "HH:mm". */
export function minutesOfDay(t: TimeOfDay): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
