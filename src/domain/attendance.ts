import type { Attendance } from './types'

export interface OnTimeSummary {
  onTime: number
  late: number
  absent: number
  total: number
  /** Whole percent, or null when there are no records. A late arrival still counts as attended. */
  pct: number | null
}

export function summarizeOnTime(records: Attendance[]): OnTimeSummary {
  const onTime = records.filter((r) => r.status === 'on-time').length
  const late = records.filter((r) => r.status === 'late').length
  const absent = records.filter((r) => r.status === 'absent').length
  const total = onTime + late + absent
  return { onTime, late, absent, total, pct: total === 0 ? null : Math.round((onTime / total) * 100) }
}

/** Most recent `n` records of one event type, oldest first (for a dot row). */
export function recentByType(records: Attendance[], eventType: Attendance['eventType'], n: number): Attendance[] {
  return records
    .filter((r) => r.eventType === eventType)
    .sort((a, b) => (a.localDate < b.localDate ? -1 : a.localDate > b.localDate ? 1 : 0))
    .slice(-n)
}

/** How many more absences are allowed before reaching the limit (never below zero). */
export function absencesLeft(records: Attendance[], allowed: number): number {
  return Math.max(0, allowed - records.filter((r) => r.status === 'absent').length)
}

/**
 * Consecutive on-time days for one event type, using the same forgiving rule as hobby streaks:
 * a single late or absent day is tolerated, two in a row end the run.
 */
export function onTimeStreak(records: Attendance[], eventType: Attendance['eventType']): number {
  const rows = records.filter((r) => r.eventType === eventType).sort((a, b) => (a.localDate < b.localDate ? -1 : a.localDate > b.localDate ? 1 : 0))
  let count = 0
  let misses = 0
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].status === 'on-time') { count++; misses = 0 } else if (++misses >= 2) break
  }
  return count
}
