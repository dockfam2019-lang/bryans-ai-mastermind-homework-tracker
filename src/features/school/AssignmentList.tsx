import { useMemo, useState } from 'react'
import { repo } from '../../data'
import { formatTime, relativeDay, diffDays } from '../../domain/dates'
import type { Assignment, Course } from '../../domain/types'
import { itemStatus } from '../../domain/status'
import { openAssignments } from '../../domain/upcoming'

interface Group { key: string; label: string; items: Assignment[] }

function toggle(a: Assignment) {
  return repo.assignments.put(a.status === 'done' ? { ...a, status: 'todo', completedAt: undefined } : { ...a, status: 'done', progress: 1, completedAt: Date.now() })
}

export function AssignmentList({ assignments, courses, now, today, onEdit }: { assignments: Assignment[]; courses: Course[]; now: Date; today: string; onEdit: (a: Assignment) => void }) {
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('')
  const [showDone, setShowDone] = useState(false)

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase()
    const match = (a: Assignment) => (!courseId || a.courseId === courseId) && (!q || a.title.toLowerCase().includes(q) || (a.notes ?? '').toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))
    const open = openAssignments(assignments).filter(match)
    const g: Group[] = [
      { key: 'overdue', label: 'Overdue', items: open.filter((a) => itemStatus(a, now) === 'overdue') },
      { key: 'today', label: 'Due today', items: open.filter((a) => itemStatus(a, now) === 'dueToday') },
      { key: 'week', label: 'Next 7 days', items: open.filter((a) => { const n = diffDays(today, a.dueDate); return n >= 1 && n <= 7 }) },
      { key: 'later', label: 'Later', items: open.filter((a) => diffDays(today, a.dueDate) > 7) },
    ]
    if (showDone) g.push({ key: 'done', label: 'Done', items: assignments.filter((a) => a.status === 'done').filter(match).sort((x, y) => (y.completedAt ?? 0) - (x.completedAt ?? 0)) })
    return g.filter((x) => x.items.length > 0)
  }, [assignments, query, courseId, showDone, now, today])

  const courseOf = (a: Assignment) => courses.find((c) => c.id === a.courseId)

  return (
    <div>
      <div className="filters">
        <label className="sr-only" htmlFor="search">Search assignments</label>
        <input id="search" type="search" placeholder="Search ( / )" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="sr-only" htmlFor="course-filter">Filter by course</label>
        <select id="course-filter" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="inline"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show done</label>
      </div>
      {groups.length === 0 && (
        <div className="empty">
          <p>{assignments.length === 0 ? 'No assignments yet.' : 'Nothing matches.'}</p>
          <p className="sub">{assignments.length === 0 ? 'Type a line in the box above, like “math ch5 problems due fri 9am ~45m”, and press Enter.' : 'Try clearing the search or the course filter.'}</p>
        </div>
      )}
      {groups.map((g) => (
        <section key={g.key} className="group" aria-label={g.label}>
          <h2 className={g.key === 'overdue' ? 'tag-overdue' : 'mono'}>{`${g.label} · ${g.items.length}`}</h2>
          <ul className="list">
            {g.items.map((a) => (
              <li key={a.id} className={a.status === 'done' ? 'is-done' : ''}>
                <button className="check" type="button" aria-label={a.status === 'done' ? `Mark ${a.title} not done` : `Mark ${a.title} done`} aria-pressed={a.status === 'done'} onClick={() => toggle(a)} />
                <button type="button" className="rowbtn title" onClick={() => onEdit(a)}>
                  <b>{a.title}</b>
                  <span className="sub"><i className="dot" style={{ background: courseOf(a)?.color ?? 'var(--muted)' }} />{courseOf(a)?.name ?? 'No course'} · {a.type}{a.subtasks.length ? ` · ${a.subtasks.filter((s) => s.done).length}/${a.subtasks.length} steps` : ''}</span>
                </button>
                <span className="sub right">{a.status !== 'done' && itemStatus(a, now) === 'overdue' && <span className="tag-overdue">Overdue · </span>}{relativeDay(a.dueDate, today)}{a.dueTime ? ` ${formatTime(a.dueTime)}` : ''}{a.estimatedMinutes ? ` · ${a.estimatedMinutes}m` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
