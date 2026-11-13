// Smart scheduling: the most urgent work claims each day's time first.
//
// Assignments are taken earliest due first (then priority, then difficulty). Each one's remaining
// minutes are split into even blocks of 25 to 60 minutes and placed on the earliest days that still
// have room before its last study day. Later-due work only gets what is left. The day's time set
// aside is never exceeded. A piece that would be shorter than 25 minutes is never created: it is
// merged into another block for the same item instead. Whatever cannot fit before the due date is
// reported as a shortfall, so the screen can warn about it by name instead of dropping minutes.
//
// Accepted and finished blocks count as work already covered and use up that day's time.
// Past-due items are never scheduled; they are flagged as overdue.
import { addDays, dueAt, weekday } from './dates'
import { loadByDay, remainingMinutes } from './load'
import { itemStatus } from './status'
import type { Assignment, LocalDate, StudyBlock } from './types'

export const DEFAULT_STUDY_MINUTES = 120
const WEEKEND_FACTOR = 0.75
export const MAX_BLOCK = 60
export const MIN_BLOCK = 25

export type NewBlock = Omit<StudyBlock, 'id' | 'createdAt' | 'updatedAt'>

export interface PlanResult {
  blocks: NewBlock[]
  /** Minutes that do not fit before the item's due date within the daily time set aside. */
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

/** The last day worth studying for an item: the day before a deadline that falls before mid-afternoon, otherwise the due date. */
export function lastStudyDay(a: Assignment): LocalDate {
  return a.dueTime && a.dueTime <= '15:00' ? addDays(a.dueDate, -1) : a.dueDate
}

/** Even blocks of 25 to 60 minutes, largest first: 77 becomes 42 + 35, 150 becomes 50 + 50 + 50. Small tasks stay whole. */
export function chunksFor(minutes: number): number[] {
  if (minutes <= MAX_BLOCK) return [minutes]
  const n = Math.ceil(minutes / MAX_BLOCK)
  const base = Math.floor(minutes / n / 5) * 5
  return [minutes - base * (n - 1), ...Array<number>(n - 1).fill(base)]
}

export function suggestPlan(args: { assignments: Assignment[]; existing: StudyBlock[]; today: LocalDate; now?: Date; horizonDays?: number; perDay?: number }): PlanResult {
  const { today, perDay = DEFAULT_STUDY_MINUTES } = args
  const [ty, tm, td] = today.split('-').map(Number)
  const now = args.now ?? new Date(ty, tm - 1, td) // start of today when no clock is given
  const horizon = args.horizonDays ?? 14
  const lastDay = addDays(today, horizon - 1)
  const counted = args.existing.filter((b) => b.state === 'accepted' || b.state === 'done')
  const dismissed = new Set(args.existing.filter((b) => b.state === 'dismissed').map((b) => `${b.assignmentId}:${b.date}`))
  const accepted = new Set(counted.map((b) => `${b.assignmentId}:${b.date}`))

  const used = new Map<LocalDate, number>()
  const covered = new Map<string, number>()
  for (const b of counted) {
    used.set(b.date, (used.get(b.date) ?? 0) + b.minutes)
    covered.set(b.assignmentId, (covered.get(b.assignmentId) ?? 0) + b.minutes)
  }
  const free = (d: LocalDate) => capacityFor(d, perDay) - (used.get(d) ?? 0)

  const open = args.assignments
    .filter((a) => a.status !== 'done')
    .sort((a, b) => dueAt(a.dueDate, a.dueTime).getTime() - dueAt(b.dueDate, b.dueTime).getTime() || b.priority - a.priority || (b.difficulty ?? 0) - (a.difficulty ?? 0))

  const blocks: NewBlock[] = []
  const shortfalls: PlanResult['shortfalls'] = []
  const overdue: string[] = []

  for (const a of open) {
    const remaining = remainingMinutes(a) - (covered.get(a.id) ?? 0)
    if (remaining <= 0) continue
    if (itemStatus(a, now) === 'overdue') { overdue.push(a.id); continue }
    let last = lastStudyDay(a)
    if (last < today) last = today // due later today: today is the only chance
    const end = last < lastDay ? last : lastDay
    const days: LocalDate[] = []
    for (let d = today; d <= end; d = addDays(d, 1)) if (!dismissed.has(`${a.id}:${d}`) && !accepted.has(`${a.id}:${d}`)) days.push(d)

    const mine = new Map<LocalDate, NewBlock>() // this item's new block per day
    const place = (d: LocalDate, minutes: number) => {
      const existing = mine.get(d)
      if (existing) existing.minutes += minutes
      else {
        const b: NewBlock = { assignmentId: a.id, date: d, minutes, state: 'suggested', examPrep: a.type === 'exam' || undefined }
        mine.set(d, b)
        blocks.push(b)
      }
      used.set(d, (used.get(d) ?? 0) + minutes)
    }

    const queue = chunksFor(remaining)
    const whole = remaining < MIN_BLOCK // a small task keeps its one short block
    let short = 0
    while (queue.length) {
      const c = queue.shift()!
      let done = false
      // 1. a whole chunk on the earliest day this item does not use yet
      for (const d of days) if (!mine.has(d) && free(d) >= c && (c >= MIN_BLOCK || whole)) { place(d, c); done = true; break }
      // 2. or extend this item's block on a day that still has room (merging, never a scrap)
      if (!done) for (const d of days) if (mine.has(d) && free(d) >= c) { place(d, c); done = true; break }
      // 3. or take whatever time is left on a day, so urgent work uses it before later work can.
      //    A new block still has to be at least 25 minutes; the rest of the chunk goes back in the queue.
      if (!done) {
        for (const d of days) {
          const part = Math.min(free(d), c)
          if (part <= 0 || (!mine.has(d) && part < MIN_BLOCK)) continue
          place(d, part)
          if (c > part) queue.unshift(c - part)
          done = true
          break
        }
      }
      if (!done) short += c
    }
    if (short > 0 && end === last) shortfalls.push({ assignmentId: a.id, minutes: short })
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
