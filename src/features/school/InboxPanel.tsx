import { repo } from '../../data'
import { parseQuickAdd } from '../../domain/quickAdd'
import type { Course, InboxItem } from '../../domain/types'
import { showToast } from '../../ui/toast'
import type { AssignmentDraft } from './AssignmentForm'

/** Quick-capture inbox: things typed in a hurry, sorted into real assignments later. */
export function InboxPanel({ items, courses, today, onSort }: { items: InboxItem[]; courses: Course[]; today: string; onSort: (draft: AssignmentDraft, item: InboxItem) => void }) {
  const pending = items.filter((i) => !i.sorted).sort((a, b) => b.capturedAt - a.capturedAt)

  async function remove(item: InboxItem) {
    await repo.inbox.remove(item.id)
    showToast('Removed from inbox.', { actionLabel: 'Undo', onAction: () => void repo.inbox.put(item) })
  }

  if (pending.length === 0) {
    return (
      <div className="empty">
        <p>Your inbox is empty.</p>
        <p className="sub">When you are in a hurry, type a line in the quick add box and choose “Save to inbox”. Sort it into a real assignment when you have a minute.</p>
      </div>
    )
  }
  return (
    <ul className="list">
      {pending.map((item) => (
        <li key={item.id}>
          <span className="title"><b>{item.text}</b><span className="sub">{new Date(item.capturedAt).toLocaleString()}</span></span>
          <button className="btn" type="button" onClick={() => onSort(parseQuickAdd(item.text, today, courses), item)}>Sort</button>
          <button className="btn ghost" type="button" onClick={() => remove(item)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
