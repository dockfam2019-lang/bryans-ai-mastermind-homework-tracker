// Tiny toast store (no dependency). Used for confirmations, Undo and the in-app reminder fallback.
export interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function subscribeToasts(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const getToasts = (): Toast[] => toasts

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function showToast(message: string, opts: { actionLabel?: string; onAction?: () => void; ms?: number } = {}): number {
  const id = nextId++
  toasts = [...toasts, { id, message, actionLabel: opts.actionLabel, onAction: opts.onAction }]
  emit()
  setTimeout(() => dismissToast(id), opts.ms ?? (opts.onAction ? 7000 : 4000))
  return id
}
