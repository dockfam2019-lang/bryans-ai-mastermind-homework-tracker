import { repo } from '../../data'
import { formatTime, relativeDay, toLocalDate } from '../../domain/dates'
import type { Assignment } from '../../domain/types'
import { showToast } from '../../ui/toast'

async function markDone(a: Assignment) {
  await repo.assignments.put({ ...a, status: 'done', progress: 1, completedAt: Date.now() })
  showToast(`Marked “${a.title}” done.`, { actionLabel: 'Undo', onAction: () => void repo.assignments.put(a) })
}

/** Past-due work is never scheduled. It sits here, clearly marked, until you catch up or mark it done. */
export function OverdueBanner({ items, now }: { items: Assignment[]; now: Date }) {
  if (items.length === 0) return null
  const today = toLocalDate(now)
  return (
    <section className="overdue" aria-label="Overdue">
      <span className="tag-overdue">Overdue · {items.length}</span>
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            <span><b>{a.title}</b> <span className="sub">was due {relativeDay(a.dueDate, today).toLowerCase()}{a.dueTime ? ` at ${formatTime(a.dueTime)}` : ''}</span></span>
            <button className="btn ghost" type="button" onClick={() => markDone(a)}>Mark done</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
