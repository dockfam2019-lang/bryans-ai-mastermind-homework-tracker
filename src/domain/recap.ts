import { summarizeOnTime } from './attendance'
import { computeBadges, computeXp, levelFor, type GameInput } from './game'
import { sessionMinutes } from './streaks'
import type { Hobby } from './types'

export interface Recap {
  assignmentsDone: number
  early: number
  focusHours: number
  hobbyHours: number
  hobbySessions: number
  bestStreak: number
  onTimePct: number | null
  topHobby?: string
  xp: number
  level: number
  badges: number
}

/** Totals for the shareable semester recap. Uses everything on record. */
export function semesterRecap(input: GameInput, hobbies: Hobby[]): Recap {
  const done = input.assignments.filter((a) => a.status === 'done')
  const early = done.filter((a) => a.completedAt && new Date(a.completedAt) < new Date(a.dueDate + 'T00:00:00')).length
  const sessionsBy = new Map<string, number>()
  for (const l of input.logs) sessionsBy.set(l.hobbyId, (sessionsBy.get(l.hobbyId) ?? 0) + 1)
  const top = [...sessionsBy.entries()].sort((a, b) => b[1] - a[1])[0]
  const xp = computeXp(input)
  return {
    assignmentsDone: done.length,
    early,
    focusHours: Math.round((input.focusSessions.reduce((s, f) => s + f.minutes, 0) / 60) * 10) / 10,
    hobbyHours: Math.round((input.logs.reduce((s, l) => s + sessionMinutes(l), 0) / 60) * 10) / 10,
    hobbySessions: input.logs.length,
    bestStreak: input.bestStreak,
    onTimePct: summarizeOnTime(input.attendance).pct,
    topHobby: top ? hobbies.find((h) => h.id === top[0])?.name : undefined,
    xp,
    level: levelFor(xp).level,
    badges: computeBadges(input).filter((b) => b.earned).length,
  }
}
