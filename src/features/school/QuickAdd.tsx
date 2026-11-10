import { useState, type FormEvent } from 'react'
import { repo } from '../../data'
import { formatTime, relativeDay } from '../../domain/dates'
import { parseQuickAdd } from '../../domain/quickAdd'
import type { Assignment, Course } from '../../domain/types'
import { showToast } from '../../ui/toast'
import type { AssignmentDraft } from './AssignmentForm'

/** One-line add: "math ch5 problems due fri 9am ~45m". Adds straight away when it understood a course and a date; otherwise opens the form prefilled. */
export function QuickAdd({ courses, today, onNeedsForm }: { courses: Course[]; today: string; onNeedsForm: (draft: AssignmentDraft) => void }) {
  const [text, setText] = useState('')
  const parsed = text.trim() ? parseQuickAdd(text, today, courses) : null
  const course = parsed?.courseId ? courses.find((c) => c.id === parsed.courseId) : undefined

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!parsed) return
    if (parsed.courseId && parsed.dueDate) {
      const record = await repo.assignments.put({
        title: parsed.title, courseId: parsed.courseId, dueDate: parsed.dueDate, dueTime: parsed.dueTime, type: parsed.type, priority: parsed.priority,
        estimatedMinutes: parsed.estimatedMinutes, status: 'todo', subtasks: [], tags: [], attachmentIds: [],
      } satisfies Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>)
      showToast(`Added “${record.title}”.`, { actionLabel: 'Undo', onAction: () => void repo.assignments.remove(record.id) })
    } else {
      onNeedsForm(parsed)
    }
    setText('')
  }

  async function toInbox() {
    if (!text.trim()) return
    const item = await repo.inbox.put({ text: text.trim(), capturedAt: Date.now(), sorted: false })
    showToast('Saved to inbox.', { actionLabel: 'Undo', onAction: () => void repo.inbox.remove(item.id) })
    setText('')
  }

  return (
    <form className="quickadd" onSubmit={submit}>
      <label className="sr-only" htmlFor="quick-add">Quick add an assignment</label>
      <div className="inline">
        <input id="quick-add" value={text} onChange={(e) => setText(e.target.value)} placeholder='Try: math ch5 problems due fri 9am ~45m' autoComplete="off" />
        <button className="btn" type="submit" disabled={!parsed}>Add</button>
        <button className="btn ghost" type="button" disabled={!parsed} onClick={toInbox}>Save to inbox</button>
      </div>
      {parsed && (
        <div className="chips" aria-live="polite">
          <span className="chip"><small>Title</small>{parsed.title}</span>
          <span className="chip"><small>Course</small>{course?.name ?? 'pick later'}</span>
          <span className="chip"><small>Due</small>{parsed.dueDate ? `${relativeDay(parsed.dueDate, today)}${parsed.dueTime ? ` ${formatTime(parsed.dueTime)}` : ''}` : 'pick later'}</span>
          <span className="chip"><small>Estimate</small>{parsed.estimatedMinutes ? `${parsed.estimatedMinutes} min` : 'none'}</span>
          <span className="chip"><small>Type</small>{parsed.type}</span>
        </div>
      )}
    </form>
  )
}
