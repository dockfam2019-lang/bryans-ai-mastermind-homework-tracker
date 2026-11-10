import type { Assignment, GradingScale } from './types'

export const DEFAULT_SCALE: Pick<GradingScale, 'name' | 'ranges'> = {
  name: 'Standard',
  ranges: [
    { min: 93, letter: 'A' }, { min: 90, letter: 'A-' }, { min: 87, letter: 'B+' }, { min: 83, letter: 'B' }, { min: 80, letter: 'B-' },
    { min: 77, letter: 'C+' }, { min: 73, letter: 'C' }, { min: 70, letter: 'C-' }, { min: 67, letter: 'D+' }, { min: 63, letter: 'D' },
    { min: 60, letter: 'D-' }, { min: 0, letter: 'F' },
  ],
}

export function percent(score: number, max: number): number | null {
  return max > 0 ? (score / max) * 100 : null
}

export function letterFor(pct: number, scale: Pick<GradingScale, 'ranges'> = DEFAULT_SCALE): string {
  const sorted = [...scale.ranges].sort((a, b) => b.min - a.min)
  return (sorted.find((r) => pct >= r.min) ?? sorted[sorted.length - 1])?.letter ?? '?'
}

/** Course average by points: total score over total possible, using graded assignments only. */
export function courseAverage(assignments: Assignment[]): { pct: number; graded: number } | null {
  const graded = assignments.filter((a) => a.score !== undefined && a.maxScore !== undefined && a.maxScore > 0)
  if (graded.length === 0) return null
  const score = graded.reduce((s, a) => s + a.score!, 0)
  const max = graded.reduce((s, a) => s + a.maxScore!, 0)
  return { pct: (score / max) * 100, graded: graded.length }
}

export interface NeededResult {
  /** Percent needed on the remaining work, or null when the inputs make no sense. */
  needed: number | null
  possible: boolean
}

/**
 * "What do I need on the final?"
 * currentPct: your grade on the part that is already graded.
 * remainingWeight: share of the final grade still to come, as a percent (for example 30 for a final worth 30%).
 * targetPct: the overall grade you want.
 */
export function whatDoINeed(currentPct: number, remainingWeight: number, targetPct: number): NeededResult {
  if (remainingWeight <= 0 || remainingWeight > 100) return { needed: null, possible: false }
  const done = 100 - remainingWeight
  const needed = (targetPct - (currentPct * done) / 100) / (remainingWeight / 100)
  return { needed: Math.max(0, needed), possible: needed <= 100 }
}

/** Lowest percent that earns the given letter on this scale. */
export function minForLetter(letter: string, scale: Pick<GradingScale, 'ranges'> = DEFAULT_SCALE): number | undefined {
  return scale.ranges.find((r) => r.letter === letter)?.min
}
