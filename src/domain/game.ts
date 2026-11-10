// Game layer (opt-in). XP, levels, badges and weekly quests are all derived from your records,
// so there is nothing to lose: a missed day takes nothing away and no copy ever scolds.
import { addDays, startOfWeek, toLocalDate } from './dates'
import { sessionMinutes } from './streaks'
import type { Assignment, Attendance, FocusSession, LocalDate, Log, ReadingItem } from './types'

export const XP = { early: 25, onDay: 15, late: 10, perFocus25: 10, checkIn: 8 } as const

export interface GameInput {
  assignments: Assignment[]
  focusSessions: FocusSession[]
  logs: Log[]
  attendance: Attendance[]
  readingItems: ReadingItem[]
  /** Longest run, in periods, across all hobbies. */
  bestStreak: number
  today: LocalDate
  weekStart: 0 | 1
}

const completedDate = (a: Assignment): LocalDate | undefined => (a.completedAt ? toLocalDate(new Date(a.completedAt)) : undefined)

export function xpForAssignment(a: Assignment): number {
  if (a.status !== 'done') return 0
  const done = completedDate(a)
  if (!done) return XP.late
  if (done < a.dueDate) return XP.early
  if (done === a.dueDate) return XP.onDay
  return XP.late
}

export function computeXp(input: GameInput): number {
  const fromWork = input.assignments.reduce((s, a) => s + xpForAssignment(a), 0)
  const fromFocus = input.focusSessions.reduce((s, f) => s + Math.max(2, Math.round((f.minutes / 25) * XP.perFocus25)), 0)
  const fromHobbies = input.logs.length * XP.checkIn
  return fromWork + fromFocus + fromHobbies
}

/** Level n starts at 50 * n * (n - 1) XP: 0, 100, 300, 600, 1000... */
export function levelFor(xp: number): { level: number; floor: number; next: number; progress: number } {
  let level = 1
  while (xp >= 50 * (level + 1) * level) level++
  const floor = 50 * level * (level - 1)
  const next = 50 * (level + 1) * level
  return { level, floor, next, progress: (xp - floor) / (next - floor) }
}

export interface Badge {
  id: string
  title: string
  description: string
  progress: number
  target: number
  earned: boolean
}

export function computeBadges(input: GameInput): Badge[] {
  const done = input.assignments.filter((a) => a.status === 'done')
  const early = done.filter((a) => { const d = completedDate(a); return d !== undefined && d < a.dueDate }).length
  const onTime = input.attendance.filter((r) => r.status === 'on-time').length
  const finishedReading = input.readingItems.filter((r) => r.pagesRead >= r.totalPages).length
  const defs: [string, string, string, number, number][] = [
    ['first-step', 'First step', 'Finish your first assignment', done.length, 1],
    ['early-bird', 'Early bird', 'Finish 5 assignments a day or more early', early, 5],
    ['focus-10', 'In the zone', 'Complete 10 focus sessions', input.focusSessions.length, 10],
    ['streak-7', 'Steady', 'Reach a 7 day or 7 week hobby streak', input.bestStreak, 7],
    ['on-time-10', 'Right on time', 'Log 10 on-time arrivals', onTime, 10],
    ['bookworm', 'Bookworm', 'Finish a reading', finishedReading, 1],
  ]
  return defs.map(([id, title, description, progress, target]) => ({ id, title, description, progress: Math.min(progress, target), target, earned: progress >= target }))
}

export interface Quest {
  id: string
  title: string
  progress: number
  target: number
  done: boolean
}

export function weeklyQuests(input: GameInput): Quest[] {
  const start = startOfWeek(input.today, input.weekStart)
  const end = addDays(start, 6)
  const inWeek = (d: LocalDate) => d >= start && d <= end
  const earlyThisWeek = input.assignments.filter((a) => { const d = completedDate(a); return a.status === 'done' && d !== undefined && inWeek(d) && d < a.dueDate }).length
  const checkIns = input.logs.filter((l) => inWeek(l.localDate)).length
  const focus = input.focusSessions.filter((f) => inWeek(f.localDate)).length
  const mk = (id: string, title: string, progress: number, target: number): Quest => ({ id, title, progress: Math.min(progress, target), target, done: progress >= target })
  return [
    mk('early-3', 'Finish 3 assignments a day early', earlyThisWeek, 3),
    mk('hobby-5', 'Check in on your hobbies 5 times', checkIns, 5),
    mk('focus-3', 'Complete 3 focus sessions', focus, 3),
  ]
}

export { sessionMinutes }
