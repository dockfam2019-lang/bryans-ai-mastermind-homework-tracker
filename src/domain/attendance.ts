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
