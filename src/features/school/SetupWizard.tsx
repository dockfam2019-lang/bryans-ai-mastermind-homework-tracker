import { useState } from 'react'
import { repo } from '../../data'
import { DAY_SHORT } from '../../domain/dates'
import { parseQuickAdd } from '../../domain/quickAdd'
import type { Course } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'
import { COURSE_COLORS } from './CoursesPanel'

interface Row { name: string; teacher: string; days: number[]; start: string; end: string; room: string }
const blank = (): Row => ({ name: '', teacher: '', days: [1, 2, 3, 4, 5], start: '09:00', end: '10:00', room: '' })

/** Two quick steps: your classes, then any assignments you already know about (one per line). */
export function SetupWizard({ open, onClose, today }: { open: boolean; onClose: () => void; today: string }) {
  return <Modal open={open} onClose={onClose} title="Set up your semester">{open && <Steps onClose={onClose} today={today} />}</Modal>
}

function Steps({ onClose, today }: { onClose: () => void; today: string }) {
  const [step, setStep] = useState(1)
  const [rows, setRows] = useState<Row[]>([blank(), blank(), blank()])
  const [lines, setLines] = useState('')
  const [saved, setSaved] = useState<Course[]>([])

  const patch = (i: number, p: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const toggleDay = (i: number, d: number) => patch(i, { days: rows[i].days.includes(d) ? rows[i].days.filter((x) => x !== d) : [...rows[i].days, d].sort() })

  async function saveCourses() {
    const made: Course[] = []
    const existing = await repo.courses.count()
    for (const [i, r] of rows.filter((x) => x.name.trim()).entries()) {
      made.push(await repo.courses.put({ name: r.name.trim(), teacher: r.teacher.trim() || undefined, color: COURSE_COLORS[(existing + i) % COURSE_COLORS.length], schedule: { kind: 'weekly', meetings: [{ days: r.days, start: r.start, end: r.end, room: r.room || undefined }] } }))
    }
    setSaved(made)
    setStep(2)
  }

  async function finish() {
    const all = [...(await repo.courses.all())]
    let added = 0
    for (const line of lines.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const p = parseQuickAdd(line, today, all)
      if (!p.courseId && all.length === 0) continue
      await repo.assignments.put({ title: p.title, courseId: p.courseId ?? all[0].id, dueDate: p.dueDate ?? today, dueTime: p.dueTime, type: p.type, priority: p.priority, estimatedMinutes: p.estimatedMinutes, status: 'todo', subtasks: [], tags: [], attachmentIds: [] })
      added++
    }
    showToast(`You are set up: ${saved.length} ${saved.length === 1 ? 'course' : 'courses'}, ${added} ${added === 1 ? 'assignment' : 'assignments'}.`)
    onClose()
  }

  if (step === 1) {
    return (
      <div className="form-grid">
        <p className="full sub">Step 1 of 2. Add your classes. You can change everything later.</p>
        {rows.map((r, i) => (
          <fieldset key={i} className="field full meeting">
            <legend>Class {i + 1}</legend>
            <div className="inline">
              <label>Name<input value={r.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder={i === 0 ? 'Algebra II' : ''} /></label>
              <label>Teacher<input value={r.teacher} onChange={(e) => patch(i, { teacher: e.target.value })} /></label>
            </div>
            <div className="days" role="group" aria-label="Days">
              {DAY_SHORT.map((d, di) => <button key={d} type="button" aria-pressed={r.days.includes(di)} className="daybtn" onClick={() => toggleDay(i, di)}>{d[0]}<span className="sr-only">{d}</span></button>)}
            </div>
            <div className="inline">
              <label>Start<input type="time" value={r.start} onChange={(e) => patch(i, { start: e.target.value })} /></label>
              <label>End<input type="time" value={r.end} onChange={(e) => patch(i, { end: e.target.value })} /></label>
              <label>Room<input value={r.room} onChange={(e) => patch(i, { room: e.target.value })} /></label>
            </div>
          </fieldset>
        ))}
        <div className="full"><button type="button" className="btn ghost" onClick={() => setRows([...rows, blank()])}>Add another class</button></div>
        <div className="actions full">
          <button className="btn" type="button" onClick={saveCourses}>Next</button>
          <button className="btn ghost" type="button" onClick={onClose}>Skip setup</button>
        </div>
      </div>
    )
  }
  return (
    <div className="form-grid">
      <p className="full sub">Step 2 of 2. Paste assignments you already know about, one per line, like “math ch5 problems due fri 9am ~45m”. Leave it empty to skip.</p>
      <label className="field full">Assignments<textarea rows={6} value={lines} onChange={(e) => setLines(e.target.value)} /></label>
      <div className="actions full">
        <button className="btn" type="button" onClick={finish}>Finish</button>
        <button className="btn ghost" type="button" onClick={() => setStep(1)}>Back</button>
      </div>
    </div>
  )
}
