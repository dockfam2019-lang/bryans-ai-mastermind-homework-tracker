import { diffDays } from './dates'
import type { LocalDate, ReadingItem } from './types'

export interface ReadingPace {
  remaining: number
  daysLeft: number
  /** Pages per day from today (inclusive) to the deadline (inclusive). */
  perDay: number
  status: 'done' | 'on-track' | 'due-today' | 'past-due'
}

export function readingPace(item: ReadingItem, today: LocalDate): ReadingPace {
  const remaining = Math.max(0, item.totalPages - item.pagesRead)
  const daysLeft = diffDays(today, item.deadline) + 1
  if (remaining === 0) return { remaining, daysLeft: Math.max(0, daysLeft), perDay: 0, status: 'done' }
  if (daysLeft <= 0) return { remaining, daysLeft: 0, perDay: remaining, status: 'past-due' }
  return { remaining, daysLeft, perDay: Math.ceil(remaining / daysLeft), status: daysLeft === 1 ? 'due-today' : 'on-track' }
}
