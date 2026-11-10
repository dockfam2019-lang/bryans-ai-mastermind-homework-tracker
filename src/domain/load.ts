// Workload estimate used by the week-load pulse chart.
// Each open assignment's remaining minutes are spread evenly over the (up to) three days
// ending on its due date, never earlier than the first day shown. Overdue work lands on
// the first day. This is a simple placeholder model; Phase 4 replaces it with real study blocks.
import { addDays, diffDays } from './dates'
import type { Assignment, LocalDate } from './types'

export interface DayLoad {
  date: LocalDate
  minutes: number
}

const LEAD_DAYS = 3
const DEFAULT_MINUTES = 45

export function remainingMinutes(a: Assignment): number {
  if (a.status === 'done') return 0
  const total = a.estimatedMinutes ?? DEFAULT_MINUTES
  const done = a.subtasks.length
    ? a.subtasks.filter((s) => s.done).length / a.subtasks.length
    : (a.progress ?? 0)
  return Math.max(0, Math.round(total * (1 - done)))
}

export function loadByDay(assignments: Assignment[], start: LocalDate, days: number): DayLoad[] {
  const out: DayLoad[] = Array.from({ length: days }, (_, i) => ({ date: addDays(start, i), minutes: 0 }))
  for (const a of assignments) {
    const mins = remainingMinutes(a)
    if (mins === 0) continue
    const dueIndex = diffDays(start, a.dueDate)
    if (dueIndex >= days) {
      // due beyond the window: count it on the last LEAD_DAYS days only if it starts inside the window
      const startIndex = dueIndex - (LEAD_DAYS - 1)
      if (startIndex >= days) continue
      const span = LEAD_DAYS
      for (let i = Math.max(0, startIndex); i < days; i++) out[i].minutes += mins / span
      continue
    }
    const last = Math.max(0, dueIndex)
    const first = Math.max(0, last - (LEAD_DAYS - 1))
    const span = last - first + 1
    for (let i = first; i <= last; i++) out[i].minutes += mins / span
  }
  return out.map((d) => ({ ...d, minutes: Math.round(d.minutes) }))
}

export function peakDay(load: DayLoad[]): DayLoad | undefined {
  return load.reduce<DayLoad | undefined>((best, d) => (!best || d.minutes > best.minutes ? d : best), undefined)
}
