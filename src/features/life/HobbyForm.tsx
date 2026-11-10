import { useState, type FormEvent } from 'react'
import { repo } from '../../data'
import { DAY_SHORT } from '../../domain/dates'
import type { Cadence, Hobby } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'
import { COURSE_COLORS } from '../school/CoursesPanel'

type Kind = Cadence['kind']

export function HobbyForm({ hobby, onClose }: { hobby: Partial<Hobby> | null; onClose: () => void }) {
  return (
    <Modal open={hobby !== null} onClose={onClose} title={hobby?.id ? 'Edit hobby' : 'New hobby'}>
      {hobby && <Body hobby={hobby} onClose={onClose} />}
    </Modal>
  )
}

function Body({ hobby, onClose }: { hobby: Partial<Hobby>; onClose: () => void }) {
  const c = hobby.cadence ?? { kind: 'perWeek', times: 3 }
  const [name, setName] = useState(hobby.name ?? '')
  const [color, setColor] = useState(hobby.color ?? COURSE_COLORS[1])
  const [goal, setGoal] = useState(hobby.goal ?? '')
  const [kind, setKind] = useState<Kind>(c.kind)
  const [days, setDays] = useState<number[]>(c.kind === 'weekdays' ? c.days : [1, 3, 5])
  const [times, setTimes] = useState(String(c.kind === 'perWeek' ? c.times : 3))
  const [minutes, setMinutes] = useState(String(c.kind === 'minutesPerWeek' ? c.minutes : 120))
  const [error, setError] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Give it a name.')
    let cadence: Cadence
    if (kind === 'daily') cadence = { kind }
    else if (kind === 'weekdays') {
      if (days.length === 0) return setError('Pick at least one day.')
      cadence = { kind, days }
    } else if (kind === 'perWeek') cadence = { kind, times: Math.min(7, Math.max(1, Number(times) || 1)) }
    else cadence = { kind, minutes: Math.max(5, Number(minutes) || 60) }
    await repo.hobbies.put({ ...hobby, name: name.trim(), icon: hobby.icon ?? name.trim()[0].toLowerCase(), color, goal: goal.trim() || undefined, cadence } as Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'> & Partial<Hobby>)
    showToast(hobby.id ? 'Saved.' : `Added ${name.trim()}.`)
    onClose()
  }

  async function remove() {
    if (!hobby.id) return
    const copy = (await repo.hobbies.get(hobby.id))!
    await repo.hobbies.remove(hobby.id)
    onClose()
    window.location.hash = '#/life'
    showToast(`Deleted ${copy.name}. Its history is kept.`, { actionLabel: 'Undo', onAction: () => void repo.hobbies.put(copy) })
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <label className="field full">Name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Guitar, drawing, running" required /></label>
      <label className="field full">Goal (optional)<input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Play a full song" /></label>
      <div className="field full" role="radiogroup" aria-label="Color">
        <span>Color</span>
        <div className="swatches">
          {COURSE_COLORS.map((col) => <button key={col} type="button" role="radio" aria-checked={color === col} aria-label={col} className="swatch" style={{ background: col }} onClick={() => setColor(col)} />)}
        </div>
      </div>
      <label className="field full">How often
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          <option value="daily">Every day</option>
          <option value="weekdays">Specific weekdays</option>
          <option value="perWeek">A number of times a week</option>
          <option value="minutesPerWeek">A number of minutes a week</option>
        </select>
      </label>
      {kind === 'weekdays' && (
        <div className="days full" role="group" aria-label="Days">
          {DAY_SHORT.map((d, i) => (
            <button key={d} type="button" className="daybtn" aria-pressed={days.includes(i)} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort())}>{d[0]}<span className="sr-only">{d}</span></button>
          ))}
        </div>
      )}
      {kind === 'perWeek' && <label className="field">Times a week<input type="number" min="1" max="7" value={times} onChange={(e) => setTimes(e.target.value)} /></label>}
      {kind === 'minutesPerWeek' && <label className="field">Minutes a week<input type="number" min="5" step="5" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>}
      <p className="sub full">Missing one day is just data. Two in a row ends a streak, and a pause or freeze never counts against you.</p>
      {error && <p className="error full" role="alert">{error}</p>}
      <div className="actions full">
        <button className="btn" type="submit">Save</button>
        <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        {hobby.id && <button className="btn danger" type="button" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
