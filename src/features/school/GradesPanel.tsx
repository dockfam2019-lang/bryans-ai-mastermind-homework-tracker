import { useState } from 'react'
import { repo } from '../../data'
import { courseAverage, DEFAULT_SCALE, letterFor, minForLetter, whatDoINeed } from '../../domain/grades'
import type { Assignment, Course, GradingScale } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'

type Ranges = GradingScale['ranges']

export function GradesPanel({ courses, assignments, scales }: { courses: Course[]; assignments: Assignment[]; scales: GradingScale[] }) {
  if (courses.length === 0) return <div className="empty"><p>No courses yet.</p><p className="sub">Add a course first, then record scores to see your average.</p></div>
  return (
    <div className="bento">
      {courses.map((c) => (
        <CourseGrades key={c.id} course={c} assignments={assignments.filter((a) => a.courseId === c.id)} scale={scales.find((s) => s.id === c.gradingScaleId)} />
      ))}
    </div>
  )
}

function CourseGrades({ course, assignments, scale }: { course: Course; assignments: Assignment[]; scale?: GradingScale }) {
  const ranges = scale?.ranges ?? DEFAULT_SCALE.ranges
  const avg = courseAverage(assignments)
  const rows = assignments.filter((a) => a.status === 'done' || a.score !== undefined).sort((x, y) => (x.dueDate < y.dueDate ? 1 : -1))
  const [editing, setEditing] = useState(false)
  const [target, setTarget] = useState(ranges.find((r) => r.letter === 'A-')?.letter ?? ranges[0].letter)
  const [weight, setWeight] = useState('20')
  const targetPct = minForLetter(target, { ranges }) ?? 90
  const need = avg ? whatDoINeed(avg.pct, Number(weight), targetPct) : null

  const saveScore = (a: Assignment, score: string, max: string) =>
    repo.assignments.put({ ...a, score: score === '' ? undefined : Number(score), maxScore: max === '' ? undefined : Number(max) })

  return (
    <section className="tile span-6" aria-label={`${course.name} grades`}>
      <header className="hobbyhead">
        <i className="dot big" style={{ background: course.color }} />
        <div><h3>{course.name}</h3><p className="sub">{avg ? `${avg.graded} graded` : 'No scores yet'}</p></div>
        <div className="streak"><div className="wide avg">{avg ? Math.round(avg.pct * 10) / 10 : '–'}<small style={{ fontSize: '0.4em' }}>{avg ? '%' : ''}</small></div><span className="mono">{avg ? letterFor(avg.pct, { ranges }) : ''}</span></div>
      </header>

      {rows.length === 0 ? <p className="sub">Finish an assignment, then enter its score here.</p> : (
        <ul className="list">
          {rows.map((a) => (
            <li key={a.id}>
              <span className="title"><b>{a.title}</b></span>
              <input className="scorein" type="number" step="any" aria-label={`Score for ${a.title}`} defaultValue={a.score ?? ''} onBlur={(e) => saveScore(a, e.target.value, String(a.maxScore ?? ''))} />
              <span className="sub">/</span>
              <input className="scorein" type="number" step="any" aria-label={`Maximum for ${a.title}`} defaultValue={a.maxScore ?? ''} onBlur={(e) => saveScore(a, String(a.score ?? ''), e.target.value)} />
            </li>
          ))}
        </ul>
      )}

      <div className="calc" role="group" aria-label="What do I need">
        <label className="field" style={{ gap: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>Goal grade
          <select value={target} onChange={(e) => setTarget(e.target.value)}>{ranges.map((r) => <option key={r.letter} value={r.letter}>{r.letter} ({r.min}%)</option>)}</select>
        </label>
        <label className="field" style={{ gap: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>Still to come (% of grade)
          <input type="number" min="1" max="100" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <button className="btn ghost" type="button" onClick={() => setEditing(true)}>Edit grading scale</button>
      </div>
      {need && (
        <p className="answer" role="status">
          {need.needed === null ? 'Enter a weight between 1 and 100.' : !need.possible
            ? `A ${target} is out of reach with ${weight}% left (it would need ${Math.round(need.needed * 10) / 10}%). Aim for the next grade down.`
            : need.needed === 0 ? `You already have a ${target} locked in.`
            : `You need about ${Math.ceil(need.needed * 10) / 10}% on the remaining ${weight}% to finish with a ${target}.`}
        </p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={`Grading scale: ${course.name}`}>
        {editing && <ScaleEditor course={course} scale={scale} onClose={() => setEditing(false)} />}
      </Modal>
    </section>
  )
}

function ScaleEditor({ course, scale, onClose }: { course: Course; scale?: GradingScale; onClose: () => void }) {
  const [rows, setRows] = useState<Ranges>((scale?.ranges ?? DEFAULT_SCALE.ranges).map((r) => ({ ...r })))
  const set = (i: number, p: Partial<Ranges[number]>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)))

  async function save() {
    const clean = rows.filter((r) => r.letter.trim()).map((r) => ({ letter: r.letter.trim(), min: Math.min(100, Math.max(0, Number(r.min) || 0)) })).sort((a, b) => b.min - a.min)
    if (clean.length === 0) return
    const saved = await repo.gradingScales.put({ ...(scale ?? {}), name: `Custom for ${course.name}`, ranges: clean })
    await repo.courses.put({ ...course, gradingScaleId: saved.id })
    showToast('Grading scale saved.')
    onClose()
  }
  async function reset() {
    await repo.courses.put({ ...course, gradingScaleId: undefined })
    showToast('Back to the standard scale.')
    onClose()
  }

  return (
    <div className="form-grid">
      <p className="full sub">Set the lowest percent that earns each grade. Use any labels you like.</p>
      {rows.map((r, i) => (
        <div key={i} className="inline full">
          <label>Grade<input value={r.letter} onChange={(e) => set(i, { letter: e.target.value })} /></label>
          <label>From %<input type="number" min="0" max="100" value={r.min} onChange={(e) => set(i, { min: Number(e.target.value) })} /></label>
          <button type="button" className="btn ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <div className="full"><button type="button" className="btn ghost" onClick={() => setRows([...rows, { letter: '', min: 0 }])}>Add a grade</button></div>
      <div className="actions full">
        <button className="btn" type="button" onClick={save}>Save</button>
        <button className="btn ghost" type="button" onClick={reset}>Use standard scale</button>
        <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
