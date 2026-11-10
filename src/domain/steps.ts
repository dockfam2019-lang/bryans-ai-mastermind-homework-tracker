// Task splitting: turn a big assignment into small steps so starting feels easy.
import type { Subtask } from './types'

export const STEP_MINUTES = 25

/** Splits `minutes` of work into steps of about 25 minutes. Short tasks stay as a single step. */
export function splitIntoSteps(title: string, minutes: number, makeId: () => string = () => crypto.randomUUID()): Subtask[] {
  const count = Math.max(1, Math.round(minutes / STEP_MINUTES))
  if (count === 1) return [{ id: makeId(), title: `Do it: ${title}`, done: false }]
  const base = Math.floor(minutes / count / 5) * 5 || 5
  return Array.from({ length: count }, (_, i) => {
    const last = i === count - 1
    const mins = last ? minutes - base * (count - 1) : base
    return { id: makeId(), title: `Part ${i + 1} of ${count} (about ${mins} min)`, done: false }
  })
}
