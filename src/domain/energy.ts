// Energy-aware scheduling. You tell the app your best and worst times of day; hard work goes in
// the best windows and light work in the worst, around classes and blocks already placed.
import type { Assignment, EnergyWindow, FocusSession, LocalDate, StudyBlock, TimeOfDay } from './types'

export interface Interval { start: number; end: number } // minutes since midnight

const toMin = (t: TimeOfDay) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toTime = (m: number): TimeOfDay => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const minutesOf = toMin

type Rating = EnergyWindow['rating']
const HARD: Rating[] = ['best', 'ok', 'worst']
const EASY: Rating[] = ['worst', 'ok', 'best']

/** First gap of `length` minutes inside `window` that does not touch any busy interval. */
function firstGap(window: Interval, busy: Interval[], length: number): number | undefined {
  let cursor = window.start
  for (const b of [...busy].sort((x, y) => x.start - y.start)) {
    if (b.end <= cursor) continue
    if (b.start >= window.end) break
    if (b.start - cursor >= length) return cursor
    cursor = Math.max(cursor, b.end)
  }
  return window.end - cursor >= length ? cursor : undefined
}

/**
 * Gives study blocks start times. Blocks are placed hardest first; difficulty 4 or more prefers
 * "best" windows, anything easier prefers "worst" ones so the best hours stay free for hard work.
 * Blocks that fit nowhere are returned unchanged.
 */
export function assignStartTimes(args: {
  blocks: StudyBlock[]
  assignments: Assignment[]
  windows: EnergyWindow[]
  busy: (date: LocalDate) => Interval[]
  difficultyOf?: (a: Assignment) => number
  /** Minutes kept free after each placed block (a short break). */
  gapMinutes?: number
}): StudyBlock[] {
  const gap = args.gapMinutes ?? 0
  const { blocks, assignments, windows } = args
  const diff = (b: StudyBlock) => {
    const a = assignments.find((x) => x.id === b.assignmentId)
    return a ? (args.difficultyOf?.(a) ?? a.difficulty ?? 3) : 3
  }
  const byDate = new Map<LocalDate, StudyBlock[]>()
  for (const b of blocks) byDate.set(b.date, [...(byDate.get(b.date) ?? []), b])

  const placed = new Map<string, StudyBlock>()
  for (const [date, dayBlocks] of byDate) {
    const busy = [...args.busy(date)]
    for (const b of dayBlocks) if (b.start) busy.push({ start: toMin(b.start), end: toMin(b.start) + b.minutes + gap })
    for (const b of [...dayBlocks].filter((x) => !x.start).sort((x, y) => diff(y) - diff(x))) {
      const order = diff(b) >= 4 ? HARD : EASY
      let start: number | undefined
      for (const rating of order) {
        for (const w of windows.filter((x) => x.rating === rating).sort((x, y) => x.startHour - y.startHour)) {
          // room for the block plus its break, so the next block never starts right on top of it
          start = firstGap({ start: w.startHour * 60, end: w.endHour * 60 + gap }, busy, b.minutes + gap)
          if (start !== undefined) break
        }
        if (start !== undefined) break
      }
      if (start !== undefined) {
        busy.push({ start, end: start + b.minutes + gap })
        placed.set(b.id, { ...b, start: toTime(start) })
      }
    }
  }
  return blocks.map((b) => placed.get(b.id) ?? b)
}

export interface LearnedWindows {
  byHour: number[]
  byWeekday: number[]
  suggested: Omit<EnergyWindow, 'id' | 'createdAt' | 'updatedAt'>[]
}

/** Finds when focus sessions actually happen. Needs at least 5 sessions; otherwise returns null. */
export function learnWindows(sessions: FocusSession[]): LearnedWindows | null {
  if (sessions.length < 5) return null
  const byHour = Array<number>(24).fill(0)
  const byWeekday = Array<number>(7).fill(0)
  for (const s of sessions) {
    const d = new Date(s.startedAt)
    byHour[d.getHours()] += s.minutes
    byWeekday[d.getDay()] += s.minutes
  }
  const max = Math.max(...byHour)
  if (max === 0) return null
  const suggested: LearnedWindows['suggested'] = []
  for (let h = 0; h < 24; h++) {
    const rating: Rating | undefined = byHour[h] >= max * 0.6 ? 'best' : byHour[h] >= max * 0.25 ? 'ok' : undefined
    if (!rating) continue
    const last = suggested[suggested.length - 1]
    if (last && last.rating === rating && last.endHour === h) last.endHour = h + 1
    else suggested.push({ startHour: h, endHour: h + 1, rating })
  }
  return { byHour, byWeekday, suggested }
}
