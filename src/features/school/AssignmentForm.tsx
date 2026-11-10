import { useState, type FormEvent } from 'react'
import { repo } from '../../data'
import type { Assignment, AssignmentType, Course, Subtask } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'

export type AssignmentDraft = Partial<Assignment> & { title: string }

const TYPES: AssignmentType[] = ['homework', 'quiz', 'exam', 'project', 'reading']

export function AssignmentForm({ draft, courses, today, onClose, onSaved }: { draft: AssignmentDraft | null; courses: Course[]; today: string; onClose: () => void; onSaved?: () => void | Promise<void> }) {
  return (
    <Modal open={draft !== null} onClose={onClose} title={draft?.id ? 'Edit assignment' : 'New assignment'}>
      {draft && <FormBody draft={draft} courses={courses} today={today} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function FormBody({ draft, courses, today, onClose, onSaved }: { draft: AssignmentDraft; courses: Course[]; today: string; onClose: () => void; onSaved?: () => void | Promise<void> }) {
  const [title, setTitle] = useState(draft.title)
  const [courseId, setCourseId] = useState(draft.courseId ?? courses[0]?.id ?? '')
  const [dueDate, setDueDate] = useState(draft.dueDate ?? today)
  const [dueTime, setDueTime] = useState(draft.dueTime ?? '')
  const [type, setType] = useState<AssignmentType>(draft.type ?? 'homework')
  const [priority, setPriority] = useState<1 | 2 | 3>(draft.priority ?? 2)
  const [estimate, setEstimate] = useState(draft.estimatedMinutes ? String(draft.estimatedMinutes) : '')
  const [difficulty, setDifficulty] = useState<string>(draft.difficulty ? String(draft.difficulty) : '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [subtasks, setSubtasks] = useState<Subtask[]>(draft.subtasks ?? [])
  const [newSub, setNewSub] = useState('')
  const [error, setError] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Give it a title.')
    if (!dueDate) return setError('Pick a due date.')
    const record = {
      ...draft,
      title: title.trim(), courseId, dueDate, dueTime: dueTime || undefined, type, priority, notes: notes.trim() || undefined,
      estimatedMinutes: estimate ? Math.max(1, Number(estimate)) : undefined,
      difficulty: difficulty ? (Number(difficulty) as 1 | 2 | 3 | 4 | 5) : undefined,
      subtasks, status: draft.status ?? 'todo', tags: draft.tags ?? [], attachmentIds: draft.attachmentIds ?? [],
    }
    await repo.assignments.put(record as Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'> & Partial<Assignment>)
    await onSaved?.()
    showToast(draft.id ? 'Saved.' : `Added “${record.title}”.`)
    onClose()
  }

  async function remove() {
    if (!draft.id) return
    const copy = (await repo.assignments.get(draft.id))!
    await repo.assignments.remove(draft.id)
    onClose()
    showToast(`Deleted “${copy.title}”.`, { actionLabel: 'Undo', onAction: () => void repo.assignments.put(copy) })
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <label className="field full">Title
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="field">Course
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.length === 0 && <option value="">No courses yet</option>}
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="field">Type
        <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="field">Due date
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </label>
      <label className="field">Due time (optional)
        <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
      </label>
      <label className="field">Estimate (minutes)
        <input type="number" min="1" inputMode="numeric" value={estimate} onChange={(e) => setEstimate(e.target.value)} />
      </label>
      <label className="field">Difficulty
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">Not set</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} of 5</option>)}
        </select>
      </label>
      <label className="field">Priority
        <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}>
          <option value={1}>Low</option><option value={2}>Normal</option><option value={3}>High</option>
        </select>
      </label>
      <label className="field full">Notes
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="field full">
        <span>Subtasks</span>
        <ul className="list">
          {subtasks.map((s) => (
            <li key={s.id}>
              <input type="checkbox" checked={s.done} aria-label={`Done: ${s.title}`} onChange={() => setSubtasks(subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))} />
              <span className="title">{s.title}</span>
              <button type="button" className="icon-btn" aria-label={`Remove ${s.title}`} onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))}>×</button>
            </li>
          ))}
        </ul>
        <div className="inline">
          <input value={newSub} placeholder="Add a step" aria-label="New subtask" onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSub.trim()) { setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSub.trim(), done: false }]); setNewSub('') } } }} />
          <button type="button" className="btn ghost" onClick={() => { if (newSub.trim()) { setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSub.trim(), done: false }]); setNewSub('') } }}>Add</button>
        </div>
      </div>
      {error && <p className="error full" role="alert">{error}</p>}
      <div className="actions full">
        <button className="btn" type="submit">Save</button>
        <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        {draft.id && <button className="btn danger" type="button" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
