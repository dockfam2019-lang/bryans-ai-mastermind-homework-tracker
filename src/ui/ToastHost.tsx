import { useSyncExternalStore } from 'react'
import { dismissToast, getToasts, subscribeToasts } from './toast'

export function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast glass">
          <span>{t.message}</span>
          {t.actionLabel && (
            <button type="button" className="toast-action" onClick={() => { t.onAction?.(); dismissToast(t.id) }}>{t.actionLabel}</button>
          )}
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
