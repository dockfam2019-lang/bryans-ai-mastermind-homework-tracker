// Exam prep plan built backward from the exam date: a first pass to find weak spots, practice in
// the middle, and a light review the day before. Never starts before today.
import { addDays, diffDays } from './dates'
import type { Assignment, LocalDate } from './types'

export interface PrepStep {
  date: LocalDate
  minutes: number
  label: string
}

const MAX_PREP_DAYS = 7
const DEFAULT_PREP_MINUTES = 150

export function examPrepPlan(exam: Assignment, today: LocalDate): PrepStep[] {
  const daysLeft = diffDays(today, exam.dueDate)
  if (daysLeft <= 0) return []
  const n = Math.min(daysLeft, MAX_PREP_DAYS)
  const total = exam.estimatedMinutes ?? DEFAULT_PREP_MINUTES
  const start = addDays(exam.dueDate, -n)

  // heavier at the start, a light review the day before
  const weights = Array.from({ length: n }, (_, i) => (n === 1 ? 1 : i === 0 ? 1.2 : i === n - 1 ? 0.5 : 1))
  const sum = weights.reduce((a, b) => a + b, 0)
  const mins = weights.map((w) => Math.max(10, Math.round(((total * w) / sum) / 5) * 5))

  return mins.map((minutes, i) => {
    let label: string
    if (n === 1) label = 'Review everything once, then rest'
    else if (i === 0) label = 'Review notes and flag weak spots'
    else if (i === n - 1) label = 'Light review and an early night'
    else label = i % 2 === 1 ? 'Practice problems on the weak spots' : 'Take a practice test'
    return { date: addDays(start, i), minutes, label }
  })
}
