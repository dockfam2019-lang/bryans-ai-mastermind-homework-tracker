// Spaced repetition (a small SM-2 variant) with one twist: when a deck is tied to an exam, the next
// review is never scheduled after the day before the exam, so everything comes up again in time.
import { addDays, diffDays } from './dates'
import type { Card, LocalDate } from './types'

export type Grade = 0 | 1 | 2 | 3 // Again, Hard, Good, Easy
export const GRADE_LABELS = ['Again', 'Hard', 'Good', 'Easy'] as const
const MIN_EASE = 1.3

export function newCardFields(today: LocalDate): Pick<Card, 'due' | 'intervalDays' | 'ease' | 'reps'> {
  return { due: today, intervalDays: 0, ease: 2.5, reps: 0 }
}

export function reviewCard<T extends Pick<Card, 'due' | 'intervalDays' | 'ease' | 'reps'>>(card: T, grade: Grade, today: LocalDate, examDate?: LocalDate): T {
  const { reps } = card
  let { intervalDays: interval, ease } = card
  if (grade === 0) {
    return { ...card, intervalDays: 0, ease: Math.max(MIN_EASE, ease - 0.2), reps: 0, due: today }
  }
  if (grade === 1) { interval = Math.max(1, Math.round(interval * 1.2)); ease = Math.max(MIN_EASE, ease - 0.15) }
  else if (grade === 2) interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease)
  else { interval = reps === 0 ? 2 : Math.round(interval * ease * 1.3); ease += 0.15 }
  interval = Math.max(1, interval)

  let due = addDays(today, interval)
  if (examDate && today < examDate) {
    const lastReview = addDays(examDate, -1)
    if (due > lastReview) due = lastReview > today ? lastReview : addDays(today, 1)
    interval = Math.max(1, diffDays(today, due))
  }
  return { ...card, intervalDays: interval, ease: Math.round(ease * 100) / 100, reps: reps + 1, due }
}

export function dueCards<T extends Pick<Card, 'due'>>(cards: T[], today: LocalDate): T[] {
  return cards.filter((c) => c.due <= today).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))
}

/** "front | back", "front - back" or tab-separated, one card per line. Lines without a separator are skipped. */
export function parseCardLines(text: string): { front: string; back: string }[] {
  return text.split(/\r?\n/).map((line) => {
    const m = line.match(/^(.+?)\s*(?:\||\t| - )\s*(.+)$/)
    return m ? { front: m[1].trim(), back: m[2].trim() } : null
  }).filter((x): x is { front: string; back: string } => !!x && !!x.front && !!x.back)
}
