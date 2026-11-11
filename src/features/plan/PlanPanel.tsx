import { useState } from 'react'
import { repo } from '../../data'
import { addDays, DAY_SHORT, formatHM, formatTime, fromLocalDate, MONTH_SHORT, relativeDay, toLocalDate } from '../../domain/dates'
import type { Suggestion } from '../../domain/livePlan'
import { remainingMinutes } from '../../domain/load'
import { capacityFor, DEFAULT_STUDY_MINUTES } from '../../domain/scheduler'
import type { StudyBlock } from '../../domain/types'
import { showToast } from '../../ui/toast'
import { startFocus } from '../focus/focusStore'
import { OverdueBanner } from '../today/OverdueBanner'
import { ShortfallWarning } from './ShortfallWarning'
import { markBlockDone, removeBlock } from './planActions'
import { acceptSuggestion, dismissSuggestion, usePlan } from './usePlan'

/** The full plan: the same suggestions Week shows (dashed) plus what you have accepted. */
export function PlanPanel() {
  const p = usePlan()
  const [moving, setMoving] = useState<string | null>(null)
  if (!p) return null
  const { now, assignments, blocks, settings, suggestions, overdue, shortfalls, overloaded } = p
  const today = toLocalDate(now)
  const perDay = settings.studyMinutesPerDay ?? DEFAULT_STUDY_MINUTES
  const titleOf = (id: string, label?: string) => label ?? assignments.find((a) => a.id === id)?.title ?? 'Study'
  const colorOf = (id: string) => p.courses.find((c) => c.id === assignments.find((a) => a.id === id)?.courseId)?.color ?? 'var(--muted)'
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const saved = blocks.filter((b) => (b.state === 'accepted' || b.state === 'done') && b.date >= today)

  async function acceptAll() {
    for (const s of suggestions) await acceptSuggestion(s, titleOf(s.assignmentId, s.label), s.date, true)
    showToast(`Planned ${suggestions.length} study ${suggestions.length === 1 ? 'block' : 'blocks'}.`)
  }

  const Row = ({ block, suggestion }: { block?: StudyBlock; suggestion?: Suggestion }) => {
    const id = block?.id ?? suggestion!.key
    const assignmentId = block?.assignmentId ?? suggestion!.assignmentId
    const title = titleOf(assignmentId, block?.label ?? suggestion?.label)
    const start = block?.start ?? suggestion?.start
    const minutes = block?.minutes ?? suggestion!.minutes
    const a = assignments.find((x) => x.id === assignmentId)
    const left = a ? remainingMinutes(a) : 0
    // partly done work shows what is left, so a short total is not mistaken for missing time
    const progress = suggestion && a?.estimatedMinutes && left < a.estimatedMinutes ? ` · ${left} of ${a.estimatedMinutes} min left` : ''
    return (
      <div className={`planblock ${block ? block.state : 'suggested'}`}>
        <i className="dot big" style={{ background: colorOf(assignmentId) }} />
        <span className="title"><b>{title}</b><span className="sub">{start ? `${formatTime(start)} · ` : ''}{minutes} min{suggestion ? ' · suggested' : ''}{progress}{(block?.examPrep ?? suggestion?.examPrep) ? ' · exam prep' : ''}</span></span>
        {suggestion && <button className="btn" type="button" onClick={() => acceptSuggestion(suggestion, title)}>Accept<span className="sr-only"> {title}</span></button>}
        {block?.state === 'accepted' && <button className="btn" type="button" onClick={() => startFocus({ type: 'assignment', id: assignmentId, title })}>Start<span className="sr-only"> {title}</span></button>}
        {block?.state === 'accepted' && <button className="btn ghost" type="button" onClick={() => markBlockDone(block)}>Done<span className="sr-only"> {title}</span></button>}
        {block?.state !== 'done' && <button className="btn ghost" type="button" onClick={() => setMoving(moving === id ? null : id)}>Move<span className="sr-only"> {title}</span></button>}
        {suggestion ? <button className="btn ghost" type="button" onClick={() => dismissSuggestion(suggestion, title)}>Skip<span className="sr-only"> {title}</span></button>
          : <button className="btn ghost" type="button" onClick={() => removeBlock(block!)}>Remove<span className="sr-only"> {title}</span></button>}
        {moving === id && (
          <input type="date" aria-label={`Move ${title} to`} min={today} defaultValue={block?.date ?? suggestion!.date} style={{ width: 'auto' }}
            onChange={(e) => {
              const d = e.target.value
              if (!d) return
              if (block) void repo.studyBlocks.put({ ...block, date: d, start: undefined })
              else void acceptSuggestion(suggestion!, title, d)
              setMoving(null)
            }} />
        )}
      </div>
    )
  }

  return (
    <div>
      <OverdueBanner items={overdue} now={now} />
      <div className="inline" style={{ marginBottom: 16 }}>
        <button className="btn" type="button" disabled={suggestions.length === 0} onClick={acceptAll}>{suggestions.length ? `Accept all ${suggestions.length} suggestions` : 'Nothing to suggest'}</button>
        <label>Time set aside per day (minutes)
          <input type="number" min="30" step="15" value={perDay} onChange={(e) => void repo.settings.put({ ...settings, studyMinutesPerDay: Math.max(30, Number(e.target.value) || DEFAULT_STUDY_MINUTES) })} />
        </label>
      </div>
      <p className="sub" style={{ marginBottom: 16 }}>Dashed rows are suggestions: the same ones shown on Week and Today. They fit each assignment before its due date, in free time after your classes. Set your best hours in Insights to change where they land.</p>

      {overloaded.length > 0 && (
        <div className="warn" role="status" style={{ marginBottom: 16 }}>
          <b>Heads up.</b> {overloaded.slice(0, 3).map((d) => `${relativeDay(d.date, today)} looks heavy (about ${formatHM(d.needed)} of work, ${formatHM(d.capacity)} set aside)`).join('; ')}. Consider starting earlier or setting aside more time.
        </div>
      )}
      <ShortfallWarning shortfalls={shortfalls} assignments={assignments} today={today} />
      {saved.length === 0 && suggestions.length === 0 && (
        <div className="empty"><p>Nothing to plan.</p><p className="sub">Add assignments with an estimate and suggestions appear here, on Week and on Today.</p></div>
      )}

      {days.map((d) => {
        const dayBlocks = saved.filter((b) => b.date === d)
        const daySuggestions = suggestions.filter((s) => s.date === d)
        if (dayBlocks.length + daySuggestions.length === 0) return null
        const planned = dayBlocks.reduce((sum, b) => sum + b.minutes, 0)
        const proposed = daySuggestions.reduce((sum, s) => sum + s.minutes, 0)
        const cap = capacityFor(d, perDay)
        const fd = fromLocalDate(d)
        const byTime = (x?: string) => x ?? '99:99'
        const rows = [...dayBlocks.map((b) => ({ t: byTime(b.start), b })), ...daySuggestions.map((s) => ({ t: byTime(s.start), s }))].sort((a, b) => a.t.localeCompare(b.t))
        return (
          <section key={d} className="planday" aria-label={d}>
            <header>
              {/* "Today Wed Nov 11", "Tomorrow Thu Nov 12", then "Fri Nov 13": the weekday appears once */}
              <b>{d <= addDays(today, 1) ? relativeDay(d, today) : DAY_SHORT[fd.getDay()]} <span className="sub">{d <= addDays(today, 1) ? `${DAY_SHORT[fd.getDay()]} ` : ''}{MONTH_SHORT[fd.getMonth()]} {fd.getDate()}</span></b>
              <span className="sub">{formatHM(planned)} planned{proposed ? ` + ${formatHM(proposed)} suggested` : ''} of {formatHM(cap)}</span>
              <div className={`capbar${planned + proposed > cap ? ' over' : ''}`}><i style={{ width: `${Math.min(100, ((planned + proposed) / cap) * 100)}%` }} /></div>
            </header>
            {rows.map((r) => ('b' in r ? <Row key={r.b!.id} block={r.b} /> : <Row key={r.s!.key} suggestion={r.s} />))}
            {planned + proposed > 90 && <p className="sub">Tip: take a 10 minute break about every 50 minutes.</p>}
          </section>
        )
      })}
    </div>
  )
}
