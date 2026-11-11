import { useState, type FormEvent } from 'react'
import { repo } from '../../data'
import { addDays, relativeDay } from '../../domain/dates'
import { readingPace } from '../../domain/reading'
import type { Course, ReadingItem } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'

/** Reading and research-paper tracker: how many pages a day to finish on time. */
export function ReadingPanel({ items, courses, today }: { items: ReadingItem[]; courses: Course[]; today: string }) {
  const [adding, setAdding] = useState(false)

  async function logPages(item: ReadingItem, pages: number) {
    if (!pages) return
    await repo.readingItems.put({ ...item, pagesRead: Math.min(item.totalPages, Math.max(0, item.pagesRead + pages)) })
  }
  async function remove(item: ReadingItem) {
    await repo.readingItems.remove(item.id)
    showToast(`Removed “${item.title}”.`, { actionLabel: 'Undo', onAction: () => void repo.readingItems.put(item) })
  }

  return (
    <div>
      <div className="inline" style={{ marginBottom: 16 }}><button className="btn" type="button" onClick={() => setAdding(true)}>Add reading</button></div>
      {items.length === 0 ? (
        <div className="empty"><p>Nothing to read yet.</p><p className="sub">Add a book chapter or a research paper with its page count and deadline. Studyboard works out how many pages a day keeps you on time.</p></div>
      ) : (
        <ul className="list">
          {[...items].sort((a, b) => (a.deadline < b.deadline ? -1 : 1)).map((i) => {
            const pace = readingPace(i, today)
            const course = courses.find((c) => c.id === i.courseId)
            return (
              <li key={i.id}>
                <span className="title">
                  <b>{i.title}</b>
                  <span className="sub">{course ? `${course.name} · ` : ''}{i.pagesRead} of {i.totalPages} pages · due {relativeDay(i.deadline, today)}</span>
                  <span className="bar" style={{ marginTop: 6, display: 'block' }}><i style={{ width: `${(i.pagesRead / i.totalPages) * 100}%` }} /></span>
                  <span className="sub">{pace.status === 'done' ? 'Finished.' : pace.status === 'past-due' ? `${pace.remaining} pages left. Pick a new deadline when you are ready.` : `About ${pace.perDay} ${pace.perDay === 1 ? 'page' : 'pages'} a day (${pace.daysLeft} ${pace.daysLeft === 1 ? 'day' : 'days'} left).`}</span>
                </span>
                {pace.status !== 'done' && <LogPages key={i.pagesRead} suggested={Math.min(pace.remaining, Math.max(1, pace.perDay))} label={i.title} onLog={(n) => logPages(i, n)} />}
                <button className="btn ghost" type="button" onClick={() => remove(i)}>Remove</button>
              </li>
            )
          })}
        </ul>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add reading">{adding && <Form courses={courses} today={today} onClose={() => setAdding(false)} />}</Modal>
    </div>
  )
}

function Form({ courses, today, onClose }: { courses: Course[]; today: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [total, setTotal] = useState('')
  const [read, setRead] = useState('0')
  const [deadline, setDeadline] = useState(addDays(today, 7))
  const [courseId, setCourseId] = useState('')
  const [error, setError] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || Number(total) < 1) return setError('Add a title and the total number of pages.')
    await repo.readingItems.put({ title: title.trim(), totalPages: Number(total), pagesRead: Math.min(Number(total), Math.max(0, Number(read) || 0)), deadline, courseId: courseId || undefined })
    showToast('Added.')
    onClose()
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <label className="field full">Title<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter 7 or a paper title" required /></label>
      <label className="field">Total pages<input type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} required /></label>
      <label className="field">Pages already read<input type="number" min="0" value={read} onChange={(e) => setRead(e.target.value)} /></label>
      <label className="field">Deadline<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required /></label>
      <label className="field">Course (optional)<select value={courseId} onChange={(e) => setCourseId(e.target.value)}><option value="">None</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {error && <p className="error full" role="alert">{error}</p>}
      <div className="actions full"><button className="btn" type="submit">Save</button><button className="btn ghost" type="button" onClick={onClose}>Cancel</button></div>
    </form>
  )
}

/** Log how many pages you read; prefilled with today's target. */
function LogPages({ suggested, label, onLog }: { suggested: number; label: string; onLog: (pages: number) => void }) {
  const [n, setN] = useState(String(suggested))
  return (
    <form className="logpages" onSubmit={(e) => { e.preventDefault(); const v = Number(n); if (v > 0) onLog(v) }}>
      <label className="sr-only" htmlFor={`pages-${label}`}>Pages read for {label}</label>
      <input id={`pages-${label}`} type="number" min="1" inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} />
      <button className="btn ghost" type="submit">Log pages</button>
    </form>
  )
}
