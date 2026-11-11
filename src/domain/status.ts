// The one place that decides whether an assignment is overdue, due today, upcoming or done.
// Every screen uses this, so an item is never "due today" on one page and "overdue" on another.
import { dueAt, toLocalDate } from './dates'
import type { Assignment } from './types'

export type ItemStatus = 'done' | 'overdue' | 'dueToday' | 'upcoming'

/** Overdue means its due moment has passed (end of day when no time is set). */
export function itemStatus(a: Assignment, now: Date): ItemStatus {
  if (a.status === 'done') return 'done'
  if (dueAt(a.dueDate, a.dueTime).getTime() < now.getTime()) return 'overdue'
  if (a.dueDate === toLocalDate(now)) return 'dueToday'
  return 'upcoming'
}

export interface Buckets {
  overdue: Assignment[]
  dueToday: Assignment[]
  upcoming: Assignment[]
  done: Assignment[]
}

const byDue = (a: Assignment, b: Assignment) => dueAt(a.dueDate, a.dueTime).getTime() - dueAt(b.dueDate, b.dueTime).getTime() || b.priority - a.priority

/** All assignments split by status, each bucket sorted by due time. */
export function bucketize(all: Assignment[], now: Date): Buckets {
  const out: Buckets = { overdue: [], dueToday: [], upcoming: [], done: [] }
  for (const a of all) {
    const s = itemStatus(a, now)
    out[s === 'dueToday' ? 'dueToday' : s].push(a)
  }
  out.overdue.sort(byDue); out.dueToday.sort(byDue); out.upcoming.sort(byDue)
  return out
}
