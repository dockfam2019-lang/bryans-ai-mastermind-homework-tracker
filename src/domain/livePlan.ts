// The one plan every screen shows (Week, Plan and Today): saved blocks plus live suggestions.
// Suggestions are computed, not stored, until you accept one. Each gets a real start time in a free
// slot (no classes, no other blocks, nothing in the past), using your energy windows or default
// after-school windows when none are set.
import { minutesOf, assignStartTimes, type Interval } from './energy'
import { predictDifficulty } from './difficulty'
import { classesOn } from './schedule'
import { DEFAULT_STUDY_MINUTES, suggestPlan, type PlanResult } from './scheduler'
import type { Assignment, Course, EnergyWindow, LocalDate, StudyBlock } from './types'
import { toLocalDate } from './dates'

type Window = Omit<EnergyWindow, 'id' | 'createdAt' | 'updatedAt'>

/** Used until you set your own energy windows: late afternoon is best, evening okay. */
export const DEFAULT_WINDOWS: Window[] = [
  { startHour: 16, endHour: 18, rating: 'best' },
  { startHour: 18, endHour: 21, rating: 'ok' },
  { startHour: 15, endHour: 16, rating: 'worst' },
]

export interface Suggestion {
  key: string
  assignmentId: string
  date: LocalDate
  start?: string
  minutes: number
  examPrep?: boolean
  label?: string
  /** Set when this suggestion is a saved one (an exam prep plan), so accepting updates it. */
  savedId?: string
}

export interface LivePlan {
  suggestions: Suggestion[]
  overdue: Assignment[]
  shortfalls: PlanResult['shortfalls']
  overloaded: PlanResult['overloaded']
}

export function livePlan(args: {
  assignments: Assignment[]; blocks: StudyBlock[]; courses: Course[]; windows: Window[]; now: Date; perDay?: number; rotationStart?: LocalDate
}): LivePlan {
  const { assignments, blocks, courses, now } = args
  const today = toLocalDate(now)
  const savedSuggestions = blocks.filter((b) => b.state === 'suggested' && b.label && b.date >= today)
  // saved prep suggestions count as planned time; other saved "suggested" rows are leftovers and are ignored
  const counted = blocks.filter((b) => b.state === 'accepted' || b.state === 'done' || b.state === 'dismissed').concat(savedSuggestions.map((b) => ({ ...b, state: 'accepted' as const })))
  const plan = suggestPlan({ assignments, existing: counted, today, now, perDay: args.perDay ?? DEFAULT_STUDY_MINUTES })

  const history = assignments.filter((a) => a.status === 'done')
  const pending = [
    ...plan.blocks.map((b, i) => ({ ...b, id: `ghost:${b.assignmentId}:${b.date}:${i}`, createdAt: 0, updatedAt: 0 }) as StudyBlock),
    ...savedSuggestions,
  ]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const busy = (date: LocalDate): Interval[] => {
    const out: Interval[] = classesOn(courses, date, args.rotationStart).map(({ meeting }) => ({ start: minutesOf(meeting.start), end: minutesOf(meeting.end) }))
    for (const b of blocks) if (b.date === date && b.start && (b.state === 'accepted' || b.state === 'done')) out.push({ start: minutesOf(b.start), end: minutesOf(b.start) + b.minutes + 10 })
    if (date === today) out.push({ start: 0, end: Math.ceil((nowMin + 5) / 15) * 15 }) // never suggest a time that has passed
    return out
  }
  const timed = assignStartTimes({
    blocks: pending,
    assignments,
    windows: (args.windows.length ? args.windows : DEFAULT_WINDOWS).map((w, i) => ({ ...w, id: `w${i}`, createdAt: 0, updatedAt: 0 })),
    busy,
    difficultyOf: (a) => predictDifficulty(a, history).score,
    gapMinutes: 10, // a short break between study blocks
  })

  const suggestions: Suggestion[] = timed.map((b) => ({
    key: b.id, assignmentId: b.assignmentId, date: b.date, start: b.start, minutes: b.minutes, examPrep: b.examPrep, label: b.label,
    savedId: b.id.startsWith('ghost:') ? undefined : b.id,
  }))
  return { suggestions, overdue: assignments.filter((a) => plan.overdue.includes(a.id)), shortfalls: plan.shortfalls, overloaded: plan.overloaded }
}
