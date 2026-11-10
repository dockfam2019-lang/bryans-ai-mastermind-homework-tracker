import { dueAt } from './dates'
import type { Assignment } from './types'

const sortKey = (a: Assignment) => dueAt(a.dueDate, a.dueTime).getTime()

/** Open assignments ordered by due date and time (overdue first). */
export function openAssignments(all: Assignment[]): Assignment[] {
  return all.filter((a) => a.status !== 'done').sort((a, b) => sortKey(a) - sortKey(b) || b.priority - a.priority)
}

/** The next open assignment that is not already past due; falls back to the oldest overdue one. */
export function nextUp(all: Assignment[], now: Date): Assignment | undefined {
  const open = openAssignments(all)
  return open.find((a) => sortKey(a) >= now.getTime()) ?? open[0]
}

export function dueOn(all: Assignment[], date: string): Assignment[] {
  return openAssignments(all).filter((a) => a.dueDate === date)
}

export function overdue(all: Assignment[], now: Date): Assignment[] {
  return openAssignments(all).filter((a) => sortKey(a) < now.getTime())
}
