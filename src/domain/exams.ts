import { diffDays } from './dates'
import type { Assignment, LocalDate } from './types'

export type ExamStage = 'upcoming' | 'soon' | 'tomorrow' | 'today'

export interface ExamCard {
  assignment: Assignment
  daysLeft: number
  stage: ExamStage
}

export function examStage(daysLeft: number): ExamStage {
  if (daysLeft <= 0) return 'today'
  if (daysLeft === 1) return 'tomorrow'
  if (daysLeft <= 3) return 'soon'
  return 'upcoming'
}

/** Open exams due within `windowDays`, soonest first. The stage escalates as the date gets closer. */
export function examCards(assignments: Assignment[], today: LocalDate, windowDays = 14): ExamCard[] {
  return assignments
    .filter((a) => a.type === 'exam' && a.status !== 'done')
    .map((a) => ({ assignment: a, daysLeft: diffDays(today, a.dueDate) }))
    .filter((c) => c.daysLeft >= 0 && c.daysLeft <= windowDays)
    .map((c) => ({ ...c, stage: examStage(c.daysLeft) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
}
