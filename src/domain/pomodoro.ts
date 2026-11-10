// Pomodoro rules. The running timer is driven by a wall-clock end time, not by counting ticks,
// so a throttled background tab or a reload never makes it drift.
export type Phase = 'focus' | 'short' | 'long'

export interface PomodoroConfig {
  focusMin: number
  shortMin: number
  longMin: number
  /** A long break after this many focus sessions. */
  longEvery: number
}

export const DEFAULT_POMODORO: PomodoroConfig = { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4 }
export const QUICK_START_MIN = 5

export const phaseMinutes = (phase: Phase, cfg: PomodoroConfig = DEFAULT_POMODORO) => (phase === 'focus' ? cfg.focusMin : phase === 'short' ? cfg.shortMin : cfg.longMin)

/** The phase that follows `phase`, given how many focus sessions are finished (including the one just ended). */
export function nextPhase(phase: Phase, completedFocus: number, cfg: PomodoroConfig = DEFAULT_POMODORO): Phase {
  if (phase !== 'focus') return 'focus'
  return completedFocus > 0 && completedFocus % cfg.longEvery === 0 ? 'long' : 'short'
}

export const remainingMs = (endAt: number, now: number) => Math.max(0, endAt - now)

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Whole minutes of focus to log for a session that started at `startedAt`; at least 1 once any time has passed. */
export function minutesToLog(startedAt: number, endedAt: number, plannedMin: number): number {
  const mins = Math.round((endedAt - startedAt) / 60000)
  return Math.min(Math.max(mins, endedAt > startedAt ? 1 : 0), plannedMin)
}
