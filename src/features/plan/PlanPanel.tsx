import { useState } from 'react'
import { repo } from '../../data'
import { addDays, DAY_SHORT, fromLocalDate, MONTH_SHORT, relativeDay, toLocalDate } from '../../domain/dates'
import { capacityFor, DEFAULT_STUDY_MINUTES, plannedMinutes, suggestPlan, type PlanResult } from '../../domain/scheduler'
import type { Assignment, Course, StudyBlock } from '../../domain/types'
import { useLive, useNow } from '../../ui/hooks'
import { startFocus } from '../focus/focusStore'
import { acceptBlock, dismissBlock, generatePlan, markBlockDone, moveBlock, removeBlock } from './planActions'

const hm = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`.replace(/^0h /, '')

export function PlanPanel() {
  const now = useNow()
  const today = toLocalDate(now)
  const assignments = useLive(() => repo.assignments.all())
  const courses = useLive(() => repo.courses.all())
  const blocks = useLive(() => repo.studyBlocks.all())
  const settings = useLive(() => repo.settings.get('main'))
  const [moving, setMoving] = useState<string | null>(null)
  const [result, setResult] = useState<PlanResult | null>(null)
  const [busy, setBusy] = useState(false)

  if (!assignments || !courses || !blocks || !settings) return null
  const perDay = settings.studyMinutesPerDay ?? DEFAULT_STUDY_MINUTES
  const byId = new Map<string, Assignment>(assignments.map((a) => [a.id, a]))
  const courseOf = (a?: Assignment): Course | undefined => courses.find((c) => c.id === a?.courseId)

  // warnings are always live, even before "Suggest" is pressed
  const live = suggestPlan({ assignments, existing: blocks.filter((b) => b.state !== 'suggested' || b.label).map((b) => (b.state === 'suggested' ? { ...b, state: 'accepted' as const } : b)), today, perDay })
  const overloaded = (result ?? live).overloaded
  const shortfalls = (result ?? live).shortfalls

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const shown = blocks.filter((b) => b.state !== 'dismissed')
  const hasSuggestions = shown.some((b) => b.state === 'suggested')

  async function suggest() {
    setBusy(true)
    setResult(await generatePlan(assignments!, today, perDay))
    setBusy(false)
  }

  return (
    <div>
      <div className="inline" style={{ marginBottom: 16 }}>
        <button className="btn" type="button" disabled={busy} onClick={suggest}>Suggest my plan</button>
        <label>Time set aside per day (minutes)
          <input type="number" min="30" step="15" value={perDay} onChange={(e) => void repo.settings.put({ ...settings, studyMinutesPerDay: Math.max(30, Number(e.target.value) || DEFAULT_STUDY_MINUTES) })} />
        </label>
      </div>

      {overloaded.length > 0 && (
        <div className="warn" role="status" style={{ marginBottom: 16 }}>
          <b>Heads up.</b> {overloaded.slice(0, 3).map((d) => `${relativeDay(d.date, today)} looks heavy (about ${hm(d.needed)} of work, ${hm(d.capacity)} set aside)`).join('; ')}. Consider starting earlier, moving something, or setting aside more time.
        </div>
      )}
      {shortfalls.length > 0 && (
        <div className="warn" role="status" style={{ marginBottom: 16 }}>
          {shortfalls.slice(0, 3).map((s) => `${byId.get(s.assignmentId)?.title ?? 'An item'} is short by ${hm(s.minutes)} before its due date`).join('; ')}.
        </div>
      )}
      {!hasSuggestions && shown.length === 0 && (
        <div className="empty"><p>No study blocks yet.</p><p className="sub">Press “Suggest my plan”. The planner fits each assignment’s estimated time before its due date, earliest due first. You can accept, move or dismiss every block.</p></div>
      )}

      {days.map((d) => {
        const dayBlocks = shown.filter((b) => b.date === d).sort((a, b) => (a.state === 'suggested' ? 1 : 0) - (b.state === 'suggested' ? 1 : 0))
        if (dayBlocks.length === 0) return null
        const total = plannedMinutes(blocks, d)
        const cap = capacityFor(d, perDay)
        const fd = fromLocalDate(d)
        return (
          <section key={d} className="planday" aria-label={d}>
            <header>
              <b>{relativeDay(d, today)} <span className="sub">{DAY_SHORT[fd.getDay()]} {MONTH_SHORT[fd.getMonth()]} {fd.getDate()}</span></b>
              <span className="sub">{hm(total)} of {hm(cap)}</span>
              <div className={`capbar${total > cap ? ' over' : ''}`}><i style={{ width: `${Math.min(100, (total / cap) * 100)}%` }} /></div>
            </header>
            {dayBlocks.map((b: StudyBlock) => {
              const a = byId.get(b.assignmentId)
              return (
                <div key={b.id} className={`planblock ${b.state}`}>
                  <i className="dot big" style={{ background: courseOf(a)?.color ?? 'var(--muted)' }} />
                  <span className="title"><b>{b.label ?? a?.title ?? 'Study'}</b><span className="sub">{b.label ? `${a?.title ?? ''} · ` : ''}{b.minutes} min{b.state === 'suggested' ? ' · suggested' : ''}{b.examPrep ? ' · exam prep' : ''}</span></span>
                  {b.state === 'suggested' && <button className="btn" type="button" onClick={() => acceptBlock(b)}>Accept</button>}
                  {b.state === 'accepted' && a && <button className="btn" type="button" onClick={() => startFocus({ type: 'assignment', id: a.id, title: a.title })}>Start</button>}
                  {b.state === 'accepted' && <button className="btn ghost" type="button" onClick={() => markBlockDone(b)}>Done</button>}
                  {b.state !== 'done' && <button className="btn ghost" type="button" onClick={() => setMoving(moving === b.id ? null : b.id)}>Move</button>}
                  {b.state === 'suggested' ? <button className="btn ghost" type="button" onClick={() => dismissBlock(b)}>Dismiss</button> : <button className="btn ghost" type="button" onClick={() => removeBlock(b)}>Remove</button>}
                  {moving === b.id && (
                    <input type="date" aria-label="Move to date" min={today} defaultValue={b.date} onChange={(e) => { if (e.target.value) { void moveBlock(b, e.target.value); setMoving(null) } }} style={{ width: 'auto' }} />
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
