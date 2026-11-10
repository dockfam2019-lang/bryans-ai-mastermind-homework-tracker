import { useState } from 'react'
import { repo } from '../../data'
import { absencesLeft, onTimeStreak, summarizeOnTime } from '../../domain/attendance'
import { DAY_SHORT, fromLocalDate, MONTH_SHORT } from '../../domain/dates'
import { classesOn } from '../../domain/schedule'
import type { Attendance, ClassNote, Course } from '../../domain/types'
import { showToast } from '../../ui/toast'

type Status = Attendance['status']
const STATUSES: { id: Status; label: string }[] = [{ id: 'on-time', label: 'On time' }, { id: 'late', label: 'Late' }, { id: 'absent', label: 'Absent' }]

const fmt = (d: string) => { const x = fromLocalDate(d); return `${DAY_SHORT[x.getDay()]} ${MONTH_SHORT[x.getMonth()]} ${x.getDate()}` }

export function AttendancePanel({ courses, records, notes, today, rotationStart }: { courses: Course[]; records: Attendance[]; notes: ClassNote[]; today: string; rotationStart?: string }) {
  const classes = classesOn(courses, today, rotationStart)
  const find = (eventType: Attendance['eventType'], courseId?: string) => records.find((r) => r.eventType === eventType && r.localDate === today && r.courseId === courseId)

  async function mark(eventType: Attendance['eventType'], status: Status, courseId?: string) {
    const existing = find(eventType, courseId)
    if (existing && existing.status === status) { await repo.attendance.remove(existing.id); return }
    await repo.attendance.put({ ...(existing ?? {}), eventType, courseId, localDate: today, status })
  }

  const Row = ({ label, eventType, courseId }: { label: string; eventType: Attendance['eventType']; courseId?: string }) => {
    const current = find(eventType, courseId)?.status
    return (
      <li>
        <span className="title"><b>{label}</b></span>
        <div className="respond" role="group" aria-label={`${label} today`}>
          {STATUSES.map((s) => <button key={s.id} type="button" aria-pressed={current === s.id} onClick={() => mark(eventType, s.id, courseId)}>{s.label}</button>)}
        </div>
      </li>
    )
  }

  const stat = (eventType: 'devotional' | 'school') => {
    const mine = records.filter((r) => r.eventType === eventType)
    return { s: summarizeOnTime(mine), streak: onTimeStreak(records, eventType) }
  }
  const dev = stat('devotional')
  const sch = stat('school')

  async function removeRecord(r: Attendance) {
    await repo.attendance.remove(r.id)
    showToast('Entry removed.', { actionLabel: 'Undo', onAction: () => void repo.attendance.put(r) })
  }

  return (
    <div className="bento">
      <section className="tile span-12" aria-label="Today">
        <h2>Today</h2>
        <ul className="list">
          <Row label="Devotional" eventType="devotional" />
          <Row label="School" eventType="school" />
          {classes.map(({ course }) => <Row key={course.id} label={course.name} eventType="class" courseId={course.id} />)}
        </ul>
        <p className="sub">Tap a choice to log it. Tap it again to clear it.</p>
      </section>

      {([['Devotional', 'devotional', dev], ['School', 'school', sch]] as const).map(([label, , d]) => (
        <section key={label} className="tile span-6" aria-label={`${label} on time`}>
          <h2>{label} on time</h2>
          <div className="wide stat">{d.s.pct === null ? '–' : `${d.s.pct}%`}</div>
          <p className="sub">{d.s.total === 0 ? 'No records yet.' : `${d.s.onTime} of ${d.s.total} on time · ${d.streak} in a row (one late day is forgiven)`}</p>
        </section>
      ))}

      <section className="tile span-12" aria-label="Classes you can still miss">
        <h2>Classes you can still miss</h2>
        {courses.filter((c) => c.allowedAbsences).length === 0 ? <p className="sub">Set “absences allowed” on a course to see this.</p> : (
          <ul className="list">
            {courses.filter((c) => c.allowedAbsences).map((c) => {
              const left = absencesLeft(records.filter((r) => r.eventType === 'class' && r.courseId === c.id), c.allowedAbsences!)
              return <li key={c.id}><i className="dot big" style={{ background: c.color }} /><span className="title"><b>{c.name}</b></span><span className="sub">{left} of {c.allowedAbsences} left</span></li>
            })}
          </ul>
        )}
      </section>

      <NotesSection courses={courses} notes={notes} today={today} />

      <section className="tile span-12" aria-label="Recent entries">
        <h2>Recent entries</h2>
        {records.length === 0 ? <p className="sub">Nothing logged yet.</p> : (
          <ul className="list">
            {[...records].sort((a, b) => (a.localDate < b.localDate ? 1 : -1)).slice(0, 12).map((r) => (
              <li key={r.id}>
                <span className="title"><b>{r.eventType === 'class' ? courses.find((c) => c.id === r.courseId)?.name ?? 'Class' : r.eventType[0].toUpperCase() + r.eventType.slice(1)}</b><span className="sub">{fmt(r.localDate)} · {r.status}</span></span>
                <button className="btn ghost" type="button" onClick={() => removeRecord(r)} aria-label={`Remove ${r.eventType} entry from ${fmt(r.localDate)}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function NotesSection({ courses, notes, today }: { courses: Course[]; notes: ClassNote[]; today: string }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [text, setText] = useState('')

  async function add() {
    if (!text.trim() || !courseId) return
    const n = await repo.classNotes.put({ courseId, localDate: today, text: text.trim() })
    showToast('Note saved.', { actionLabel: 'Undo', onAction: () => void repo.classNotes.remove(n.id) })
    setText('')
  }
  async function remove(n: ClassNote) {
    await repo.classNotes.remove(n.id)
    showToast('Note deleted.', { actionLabel: 'Undo', onAction: () => void repo.classNotes.put(n) })
  }

  return (
    <section className="tile span-12" aria-label="Class notes">
      <h2>Class notes</h2>
      {courses.length === 0 ? <p className="sub">Add a course to take notes.</p> : (
        <>
          <div className="inline">
            <label>Course<select value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label style={{ flex: 4 }}>Note<input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void add() }} placeholder="Quiz Friday, bring a calculator" /></label>
            <button className="btn" type="button" onClick={add}>Add note</button>
          </div>
          <ul className="list">
            {[...notes].sort((a, b) => (a.localDate === b.localDate ? b.createdAt - a.createdAt : a.localDate < b.localDate ? 1 : -1)).slice(0, 10).map((n) => (
              <li key={n.id}>
                <i className="dot big" style={{ background: courses.find((c) => c.id === n.courseId)?.color }} />
                <span className="title"><b>{n.text}</b><span className="sub">{courses.find((c) => c.id === n.courseId)?.name} · {fmt(n.localDate)}</span></span>
                <button className="btn ghost" type="button" onClick={() => remove(n)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
