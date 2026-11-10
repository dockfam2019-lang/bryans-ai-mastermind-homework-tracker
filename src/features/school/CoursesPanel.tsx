import { useState, type FormEvent } from 'react'
import { repo } from '../../data'
import { DAY_SHORT, formatTime } from '../../domain/dates'
import type { Course, Meeting, Schedule } from '../../domain/types'
import { newFromShare, readClassShare, toClassShare } from '../../domain/share'
import { Modal } from '../../ui/Modal'
import { downloadBlob } from '../insights/recapImage'
import { showToast } from '../../ui/toast'

export const COURSE_COLORS = ['#6fb4ff', '#ffb23e', '#c79bff', '#5fe1c2', '#ff8fa8', '#f0e060', '#9ad06b', '#ff9c7a']

export function scheduleSummary(c: Course): string {
  if (c.schedule.meetings.length === 0) return 'No meeting times'
  return c.schedule.meetings
    .map((m) => `${m.days.map((d) => DAY_SHORT[d]).join(' ')} ${formatTime(m.start)} to ${formatTime(m.end)}${m.room ? ` · ${m.room}` : ''}${m.rotation && m.rotation !== 'both' ? ` · ${m.rotation} days` : ''}`)
    .join(' / ')
}

const emptyMeeting = (): Meeting => ({ days: [1, 3, 5], start: '09:00', end: '10:00' })

export function CoursesPanel({ courses }: { courses: Course[] }) {
  const [editing, setEditing] = useState<Partial<Course> | null>(null)

  async function share(c: Course) {
    const file = toClassShare(c, await repo.assignments.all())
    downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `studyboard-class-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`)
    showToast(`Class file saved with ${file.assignments.length} open ${file.assignments.length === 1 ? 'assignment' : 'assignments'}. Send it to a classmate to import.`)
  }

  async function importShare(file?: File) {
    if (!file) return
    try {
      const s = readClassShare(JSON.parse(await file.text()))
      const all = await repo.courses.all()
      let course = all.find((c) => c.name.toLowerCase() === s.course.name.toLowerCase())
      const madeCourse = !course
      if (!course) course = await repo.courses.put({ name: s.course.name, color: s.course.color || COURSE_COLORS[all.length % COURSE_COLORS.length], teacher: s.course.teacher, schedule: s.course.schedule ?? { kind: 'weekly', meetings: [] } })
      const fresh = newFromShare(s, await repo.assignments.all(), course.id)
      const ids: string[] = []
      for (const a of fresh) ids.push((await repo.assignments.put({ ...a, courseId: course.id, priority: a.type === 'exam' || a.type === 'quiz' ? 3 : 2, status: 'todo', subtasks: [], tags: ['shared'], attachmentIds: [] })).id)
      const courseId = course.id
      showToast(`Imported ${ids.length} ${ids.length === 1 ? 'assignment' : 'assignments'}${madeCourse ? ` and the course ${s.course.name}` : ''}.`, { actionLabel: 'Undo', onAction: () => void (async () => { for (const id of ids) await repo.assignments.remove(id); if (madeCourse) await repo.courses.remove(courseId) })() })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }
  return (
    <div>
      <div className="inline" style={{ marginBottom: 16 }}>
        <button className="btn" type="button" onClick={() => setEditing({})}>Add course</button>
        <label className="btn ghost" style={{ display: 'inline-block' }}>Import class file<input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void importShare(e.target.files?.[0]); e.target.value = '' }} /></label>
      </div>
      {courses.length === 0 ? (
        <div className="empty"><p>No courses yet.</p><p className="sub">Add your classes so assignments, your timetable and the week view line up.</p></div>
      ) : (
        <ul className="list">
          {courses.map((c) => (
            <li key={c.id}>
              <i className="dot big" style={{ background: c.color }} />
              <span className="title"><b>{c.name}</b><span className="sub">{c.teacher ? `${c.teacher} · ` : ''}{scheduleSummary(c)}</span></span>
              <button className="btn ghost" type="button" onClick={() => share(c)}>Share</button>
              <button className="btn ghost" type="button" onClick={() => setEditing(c)}>Edit</button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit course' : 'New course'}>
        {editing && <CourseForm course={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}

function CourseForm({ course, onClose }: { course: Partial<Course>; onClose: () => void }) {
  const [name, setName] = useState(course.name ?? '')
  const [color, setColor] = useState(course.color ?? COURSE_COLORS[0])
  const [teacher, setTeacher] = useState(course.teacher ?? '')
  const [kind, setKind] = useState<Schedule['kind']>(course.schedule?.kind ?? 'weekly')
  const [meetings, setMeetings] = useState<Meeting[]>(course.schedule?.meetings?.length ? course.schedule.meetings : [emptyMeeting()])
  const [absences, setAbsences] = useState(course.allowedAbsences ? String(course.allowedAbsences) : '')
  const [error, setError] = useState('')

  const setMeeting = (i: number, patch: Partial<Meeting>) => setMeetings(meetings.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  const toggleDay = (i: number, d: number) => setMeeting(i, { days: meetings[i].days.includes(d) ? meetings[i].days.filter((x) => x !== d) : [...meetings[i].days, d].sort() })

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Give the course a name.')
    const clean = meetings.filter((m) => m.days.length > 0)
    await repo.courses.put({ ...course, name: name.trim(), color, teacher: teacher.trim() || undefined, schedule: { kind, meetings: clean }, allowedAbsences: absences ? Number(absences) : undefined } as Omit<Course, 'id' | 'createdAt' | 'updatedAt'> & Partial<Course>)
    showToast(course.id ? 'Saved.' : `Added ${name.trim()}.`)
    onClose()
  }

  async function remove() {
    if (!course.id) return
    const copy = (await repo.courses.get(course.id))!
    await repo.courses.remove(course.id)
    onClose()
    showToast(`Deleted ${copy.name}. Its assignments are kept.`, { actionLabel: 'Undo', onAction: () => void repo.courses.put(copy) })
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <label className="field full">Name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="field">Teacher<input value={teacher} onChange={(e) => setTeacher(e.target.value)} /></label>
      <label className="field">Absences allowed<input type="number" min="0" inputMode="numeric" value={absences} onChange={(e) => setAbsences(e.target.value)} /></label>
      <div className="field full" role="radiogroup" aria-label="Color">
        <span>Color</span>
        <div className="swatches">
          {COURSE_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} className="swatch" style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
      <label className="field full">Schedule type
        <select value={kind} onChange={(e) => setKind(e.target.value as Schedule['kind'])}>
          <option value="weekly">Weekly timetable</option>
          <option value="block">Block or period based</option>
          <option value="rotating">Rotating A/B days</option>
        </select>
      </label>
      {meetings.map((m, i) => (
        <fieldset key={i} className="field full meeting">
          <legend>Meeting {i + 1}</legend>
          <div className="days" role="group" aria-label="Days">
            {DAY_SHORT.map((d, di) => (
              <button key={d} type="button" aria-pressed={m.days.includes(di)} className="daybtn" onClick={() => toggleDay(i, di)}>{d[0]}<span className="sr-only">{d}</span></button>
            ))}
          </div>
          <div className="inline">
            <label>Start<input type="time" value={m.start} onChange={(e) => setMeeting(i, { start: e.target.value })} /></label>
            <label>End<input type="time" value={m.end} onChange={(e) => setMeeting(i, { end: e.target.value })} /></label>
            <label>Room<input value={m.room ?? ''} onChange={(e) => setMeeting(i, { room: e.target.value || undefined })} /></label>
            {kind === 'rotating' && (
              <label>Rotation
                <select value={m.rotation ?? 'both'} onChange={(e) => setMeeting(i, { rotation: e.target.value as Meeting['rotation'] })}>
                  <option value="both">Every day</option><option value="A">A days</option><option value="B">B days</option>
                </select>
              </label>
            )}
            {meetings.length > 1 && <button type="button" className="btn ghost" onClick={() => setMeetings(meetings.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        </fieldset>
      ))}
      <div className="full"><button type="button" className="btn ghost" onClick={() => setMeetings([...meetings, emptyMeeting()])}>Add another meeting</button></div>
      {error && <p className="error full" role="alert">{error}</p>}
      <div className="actions full">
        <button className="btn" type="submit">Save</button>
        <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        {course.id && <button className="btn danger" type="button" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
