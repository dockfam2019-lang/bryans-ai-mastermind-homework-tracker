// Difficulty prediction for the planner. No network and no model: a transparent heuristic that
// starts from the kind of work and learns from what you have finished. Every score comes with reasons.
import type { Assignment, AssignmentType } from './types'

export interface Prediction {
  /** 1 (easy) to 5 (hard), one decimal. */
  score: number
  source: 'rated' | 'predicted'
  reasons: string[]
}

const BASE: Record<AssignmentType, number> = { homework: 2, reading: 2, quiz: 3, project: 3.5, exam: 4.5 }
const HARD_WORDS = /\b(final|midterm|research|lab report|essay|project|paper|presentation)\b/i

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export function predictDifficulty(a: Assignment, history: Assignment[]): Prediction {
  if (a.difficulty) return { score: a.difficulty, source: 'rated', reasons: ['You rated this'] }
  const reasons: string[] = [`${a.type} work usually feels ${BASE[a.type] >= 4 ? 'hard' : BASE[a.type] >= 3 ? 'medium' : 'light'}`]
  let score = BASE[a.type]

  const est = a.estimatedMinutes ?? 0
  if (est >= 120) { score += 0.7; reasons.push('a long task (2 hours or more)') }
  else if (est >= 60) { score += 0.3; reasons.push('about an hour or more of work') }
  if (HARD_WORDS.test(a.title)) { score += 0.3; reasons.push('the title suggests a bigger piece of work') }

  const sameCourse = history.filter((h) => h.id !== a.id && h.courseId === a.courseId && h.status === 'done')
  const ratios = sameCourse.filter((h) => h.actualMinutes && h.estimatedMinutes).map((h) => h.actualMinutes! / h.estimatedMinutes!)
  if (ratios.length >= 2) {
    const r = avg(ratios)
    if (r > 1.3) { score += 0.5; reasons.push('work in this course usually takes longer than you estimate') }
    else if (r < 0.8) { score -= 0.3; reasons.push('work in this course usually takes less time than you estimate') }
  }
  const ratings = sameCourse.filter((h) => h.difficulty).map((h) => h.difficulty!)
  if (ratings.length >= 2) {
    score = 0.6 * score + 0.4 * avg(ratings)
    reasons.push(`you rated past ${ratings.length} items in this course about ${avg(ratings).toFixed(1)}`)
  }
  return { score: Math.round(Math.min(5, Math.max(1, score)) * 10) / 10, source: 'predicted', reasons }
}

/** Open assignments from hardest to easiest, with the reasons. Ties keep the earlier due date first. */
export function rankByHardness(open: Assignment[], history: Assignment[]): { assignment: Assignment; prediction: Prediction }[] {
  return open
    .map((assignment) => ({ assignment, prediction: predictDifficulty(assignment, history) }))
    .sort((x, y) => y.prediction.score - x.prediction.score || (x.assignment.dueDate < y.assignment.dueDate ? -1 : 1))
}
