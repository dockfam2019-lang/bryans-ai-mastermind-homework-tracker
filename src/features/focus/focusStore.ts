// Shared focus-timer state. Driven by wall-clock times so reloads and throttled tabs stay accurate.
// Persisted to localStorage so an open session survives a refresh.
import { useSyncExternalStore } from 'react'
import { repo } from '../../data'
import { toLocalDate } from '../../domain/dates'
import { DEFAULT_POMODORO, nextPhase, phaseMinutes, QUICK_START_MIN, type Phase } from '../../domain/pomodoro'
import { showToast } from '../../ui/toast'
import { notify } from '../../ui/useReminders'

export interface FocusTarget { type: 'assignment' | 'hobby' | 'course'; id: string; title: string }

export interface FocusState {
  mode: 'idle' | 'running' | 'paused' | 'awaiting'
  phase: Phase
  target: FocusTarget | null
  plannedMin: number
  endAt: number
  pausedRemainingMs: number
  /** Milliseconds actually run in this phase before the current resume. */
  accumMs: number
  runStartedAt: number
  startedAt: number
  completedFocus: number
  quick: boolean
  /** What starts next when mode is "awaiting". */
  next: Phase
}

const KEY = 'studyboard-focus'
const IDLE: FocusState = { mode: 'idle', phase: 'focus', target: null, plannedMin: 25, endAt: 0, pausedRemainingMs: 0, accumMs: 0, runStartedAt: 0, startedAt: 0, completedFocus: 0, quick: false, next: 'focus' }

function load(): FocusState {
  try { return { ...IDLE, ...(JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<FocusState> | null) } } catch { return IDLE }
}
let state: FocusState = load()
const listeners = new Set<() => void>()
function set(next: FocusState) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
  listeners.forEach((l) => l())
}

export const getFocus = () => state
export const subscribeFocus = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn) }
export const useFocus = () => useSyncExternalStore(subscribeFocus, getFocus)

function startPhase(phase: Phase, minutes: number, patch: Partial<FocusState> = {}) {
  const now = Date.now()
  set({ ...state, ...patch, mode: 'running', phase, plannedMin: minutes, startedAt: now, runStartedAt: now, accumMs: 0, endAt: now + minutes * 60000, pausedRemainingMs: 0 })
}

/** Start a focus session on something. `quick` starts the 5 minute "just begin" version. */
export function startFocus(target: FocusTarget, opts: { quick?: boolean; minutes?: number } = {}) {
  const minutes = opts.quick ? QUICK_START_MIN : opts.minutes ?? DEFAULT_POMODORO.focusMin
  startPhase('focus', minutes, { target, quick: !!opts.quick, completedFocus: state.target?.id === target.id ? state.completedFocus : 0 })
}

export function pauseFocus() {
  if (state.mode !== 'running') return
  const now = Date.now()
  set({ ...state, mode: 'paused', pausedRemainingMs: Math.max(0, state.endAt - now), accumMs: state.accumMs + (now - state.runStartedAt) })
}

export function resumeFocus() {
  if (state.mode !== 'paused') return
  const now = Date.now()
  set({ ...state, mode: 'running', runStartedAt: now, endAt: now + state.pausedRemainingMs })
}

export function elapsedMs(s: FocusState, now = Date.now()): number {
  return s.accumMs + (s.mode === 'running' ? now - s.runStartedAt : 0)
}

async function logFocus(ms: number) {
  const target = state.target
  const minutes = Math.min(state.plannedMin, Math.max(ms > 0 ? 1 : 0, Math.round(ms / 60000)))
  if (!target || minutes <= 0) return 0
  await repo.focusSessions.put({ targetType: target.type, targetId: target.id, localDate: toLocalDate(new Date(state.startedAt || Date.now())), startedAt: state.startedAt, minutes })
  if (target.type === 'assignment') {
    const a = await repo.assignments.get(target.id)
    if (a) await repo.assignments.put({ ...a, actualMinutes: (a.actualMinutes ?? 0) + minutes })
  }
  return minutes
}

/** Called by the dock every half second; ends the phase when the time is up. */
export function tickFocus(now = Date.now()) {
  if (state.mode === 'running' && now >= state.endAt) void finishPhase(true)
}

async function finishPhase(natural: boolean) {
  if (state.phase === 'focus') {
    const minutes = await logFocus(natural ? state.plannedMin * 60000 : elapsedMs(state))
    const done = state.completedFocus + (minutes > 0 ? 1 : 0)
    const next = nextPhase('focus', done)
    set({ ...state, mode: 'awaiting', completedFocus: done, next, accumMs: 0 })
    if (minutes > 0) notify('Focus complete', `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} logged${state.target ? ` on ${state.target.title}` : ''}. ${state.quick ? 'You started. Keep going?' : 'Time for a break.'}`)
  } else {
    set({ ...state, mode: 'awaiting', next: 'focus', accumMs: 0 })
    notify('Break over', 'Ready for the next focus session?')
  }
}

/** End the current focus session early, keeping the time already spent. */
export function finishEarly() { void finishPhase(false) }

export function startNext() {
  if (state.mode !== 'awaiting') return
  startPhase(state.next, phaseMinutes(state.next), { quick: false })
}

/** After a quick start: carry on with a full session on the same target. */
export function keepGoing() {
  if (state.mode === 'awaiting' && state.target) startPhase('focus', DEFAULT_POMODORO.focusMin - QUICK_START_MIN, { quick: false })
}

export function skipBreak() {
  if (state.mode === 'awaiting' || state.phase !== 'focus') startPhase('focus', DEFAULT_POMODORO.focusMin, { quick: false })
}

export function stopFocus() {
  set({ ...IDLE })
  showToast('Focus session closed.')
}
