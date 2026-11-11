// Smart scheduling v1: greedy by due date, then priority and difficulty.
//
// For each open assignment (earliest due first) the planner places at most one study block a day,
// starting today, until its remaining minutes are covered or the due date arrives. Blocks you have
// already accepted or finished count as done work and use up that day's capacity. Anything that
// cannot fit before its due date is reported as a shortfall so the week can be called overloaded.
import { addDays, dueAt, weekday } from './dates'
import { loadByDay, remainingMinutes } from './load'
import { itemStatus } from './status'
import type { Assignment, LocalDate, StudyBlock } from './types'

export const DEFAULT_STUDY_MINUTES = 120
const WEEKEND_FACTOR = 0.75
const MAX_BLOCK = 60
const MIN_BLOCK = 15

export type NewBlock = Omit<StudyBlock, 'id' | 'createdAt' | 'updatedAt'>

export interface PlanResult {
  blocks: NewBlock[]
  shortfalls: { assignmentId: string; minutes: number }[]
  /** Past-due items. They are never scheduled (a block after the due date is useless); they are flagged to catch up on. */
  overdue: string[]
  /** Days where the estimated work is more than the time set aside. */
  overloaded: { date: LocalDate; needed: number; capacity: number }[]
}

export function capacityFor(date: LocalDate, perDay = DEFAULT_STUDY_MINUTES): number {
  const w = weekday(date)
  return w === 0 || w === 6 ? Math.round((perDay * WEEKEND_FACTOR) / 5) * 5 : perDay
}

export function suggestPlan(args: { assignments: Assignment[]; existing: StudyBlock[]; today: LocalDate; now?: Date; horizonDays?: number; perDay?: number }): PlanResult {
  const { today, perDay = DEFAULT_STUDY_MINUTES } = args
  const [ty, tm, td] = today.split('-').map(Number)
  const now = args.now ?? new Date(ty, tm - 1, td) // start of today when no clock is given
  const horizon = args.horizonDays ?? 14
  const lastDay = addDays(today, horizon - 1)
  const counted = args.existing.filter((b) => b.state === 'accepted' || b.state === 'done')
  const dismissed = new Set(args.existing.filter((b) => b.state === 'dismissed').map((b) => `${b.assignmentId}:${b.date}`))
  const alreadyPlanned = new Set(counted.map((b) => `${b.assignmentId}:${b.date}`)) // one block per assignment per day

  const used = new Map<LocalDate, number>()
  const covered = new Map<string, number>()
  for (const b of counted) {
    used.set(b.date, (used.get(b.date) ?? 0) + b.minutes)
    covered.set(b.assignmentId, (covered.get(b.assignmentId) ?? 0) + b.minutes)
  }

  const open = args.assignments
    .filter((a) => a.status !== 'done')
    .sort((a, b) => dueAt(a.dueDate, a.dueTime).getTime() - dueAt(b.dueDate, b.dueTime).getTime() || b.priority - a.priority || (b.difficulty ?? 0) - (a.difficulty ?? 0))

  const blocks: NewBlock[] = []
  const shortfalls: PlanResult['shortfalls'] = []
  const overdue: string[] = []

  for (const a of open) {
    let remaining = remainingMinutes(a) - (covered.get(a.id) ?? 0)
    if (remaining <= 0) continue
    if (itemStatus(a, now) === 'overdue') { overdue.push(a.id); continue }
    // study by the day before anything due before mid-afternoon; otherwise up to the due date
    let due = a.dueTime && a.dueTime <= '15:00' ? addDays(a.dueDate, -1) : a.dueDate
    if (due < today) due = today // due later today: today is the only chance
    const end = due < lastDay ? due : lastDay
    for (let d = today; d <= end && remaining > 0; d = addDays(d, 1)) {
      if (dismissed.has(`${a.id}:${d}`) || alreadyPlanned.has(`${a.id}:${d}`)) continue
      const avail = capacityFor(d, perDay) - (used.get(d) ?? 0)
      let minutes = Math.min(remaining, MAX_BLOCK, Math.max(avail, 0))
      // no scraps: a block is at least 15 minutes (or the whole rest, if less is left)
      if (minutes < Math.min(remaining, MIN_BLOCK)) continue
      // a leftover under 15 minutes is folded into this block (even a little past the day's time) instead of becoming its own
      if (remaining - minutes > 0 && remaining - minutes < MIN_BLOCK && avail + MIN_BLOCK >= remaining) minutes = remaining
      blocks.push({ assignmentId: a.id, date: d, minutes, state: 'suggested', examPrep: a.type === 'exam' || undefined })
      used.set(d, (used.get(d) ?? 0) + minutes)
      remaining -= minutes
    }
    if (remaining > 0 && due <= lastDay) shortfalls.push({ assignmentId: a.id, minutes: remaining })
  }

  const overloaded = loadByDay(args.assignments, today, horizon)
    .map((d) => ({ date: d.date, needed: d.minutes, capacity: capacityFor(d.date, perDay) }))
    .filter((d) => d.needed > d.capacity)

  return { blocks, shortfalls, overdue, overloaded }
}

/** Minutes already planned (accepted, done or suggested) for a day. */
export function plannedMinutes(blocks: StudyBlock[], date: LocalDate): number {
  return blocks.filter((b) => b.date === date && b.state !== 'dismissed').reduce((s, b) => s + b.minutes, 0)
}

