import { useEffect, useRef, useState } from 'react'
import { repo } from '../../data'
import { addDays, DAY_SHORT, formatTime, fromLocalDate, MONTH_SHORT, relativeDay, startOfWeek, toLocalDate, weekDates } from '../../domain/dates'

/** "Nov 8 – 14", or "Oct 30 – Nov 5" when the week crosses a month. */
function weekLabel(start: string): string {
  const a = fromLocalDate(start), b = fromLocalDate(addDays(start, 6))
  return a.getMonth() === b.getMonth() ? `${MONTH_SHORT[a.getMonth()]} ${a.getDate()} – ${b.getDate()}` : `${MONTH_SHORT[a.getMonth()]} ${a.getDate()} – ${MONTH_SHORT[b.getMonth()]} ${b.getDate()}`
}
import { monthGrid, sameMonth, shiftMonth } from '../../domain/calendar'
import { loadByDay } from '../../domain/load'
import { classesOn } from '../../domain/schedule'
import type { Assignment, Course } from '../../domain/types'
import { openAssignments } from '../../domain/upcoming'
import { useLive, useNow } from '../../ui/hooks'
import { PlanPanel } from '../plan/PlanPanel'
import { WeekTimeline } from './WeekTimeline'

const TABS = [{ id: '', label: 'Week' }, { id: 'month', label: 'Month' }, { id: 'plan', label: 'Plan' }]

export function WeekPage({ tab }: { tab: string }) {
  const now = useNow()
  const today = toLocalDate(now)
  const assignments = useLive(() => repo.assignments.all())
  const courses = useLive(() => repo.courses.all())
  const settings = useLive(() => repo.settings.get('main'))
  const blocks = useLive(() => repo.studyBlocks.all())
  const [anchor, setAnchor] = useState(today) // any date inside the week or month being shown
  const [selected, setSelected] = useState<string | null>(null)
  const swipe = useRef<{ x: number; t: number } | null>(null)
  const wheel = useRef(0)
  const moveRef = useRef<(delta: number) => void>(() => {})

  // fewer clicks: arrow keys move between weeks or months
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) || document.querySelector('dialog[open]')) return
      if (e.key === 'ArrowLeft') moveRef.current(-1)
      if (e.key === 'ArrowRight') moveRef.current(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!assignments || !courses || !settings || !blocks) return null
  const weekStart = settings.weekStart
  const open = openAssignments(assignments)
  const courseOf = (a: Assignment): Course | undefined => courses.find((c) => c.id === a.courseId)
  const dueOn = (d: string) => open.filter((a) => a.dueDate === d)

  const month = tab === 'month'
  const plan = tab === 'plan'
  const weeks = month ? monthGrid(anchor, weekStart) : [weekDates(anchor, weekStart)]
  const first = weeks[0][0]
  const gridLoad = loadByDay(assignments, first, weeks.length * 7)
  const loadOf = (d: string) => gridLoad.find((x) => x.date === d)?.minutes ?? 0
  const maxLoad = Math.max(60, ...gridLoad.map((d) => d.minutes))

  const move = (delta: number) => setAnchor(month ? shiftMonth(anchor, delta) : addDays(anchor, delta * 7))
  moveRef.current = plan ? () => {} : move
  const label = month
    ? `${MONTH_SHORT[fromLocalDate(anchor).getMonth()]} ${fromLocalDate(anchor).getFullYear()}`
    : weekLabel(startOfWeek(anchor, weekStart))

  const detail = selected

  return (
    <>
      <div className="pagehead">
        <p className="mono">{plan ? 'Study blocks' : month ? 'Month' : 'Week'}</p>
        <h1>{plan ? 'Plan' : label}</h1>
      </div>

      <nav className="tabs" aria-label="Calendar views">
        {TABS.map((t) => <a key={t.id} href={`#/week${t.id ? `/${t.id}` : ''}`} aria-current={tab === t.id ? 'page' : undefined}>{t.label}</a>)}
        <span className="grow" />
        {!plan && (
          <span className="pager">
            <button className="btn ghost" type="button" onClick={() => move(-1)} aria-label={month ? 'Previous month' : 'Previous week'} title="Or press ←">‹</button>
            <button className="btn ghost" type="button" onClick={() => setAnchor(today)}>Today</button>
            <button className="btn ghost" type="button" onClick={() => move(1)} aria-label={month ? 'Next month' : 'Next week'} title="Or press →">›</button>
          </span>
        )}
      </nav>

      <div
        className="swipe"
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, t: Date.now() } }}
        onPointerUp={(e) => {
          const s = swipe.current; swipe.current = null
          if (s && !plan && Date.now() - s.t < 600 && Math.abs(e.clientX - s.x) > 80 && !(e.target as HTMLElement).closest('.timeline')) move(e.clientX < s.x ? 1 : -1)
        }}
        onWheel={(e) => {
          if (plan) return
          const strip = (e.target as HTMLElement).closest<HTMLElement>('.timeline')
          if (strip && strip.scrollWidth > strip.clientWidth) return // the strip scrolls sideways itself on narrow screens
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
          wheel.current += e.deltaX
          if (Math.abs(wheel.current) > 140) { move(wheel.current > 0 ? 1 : -1); wheel.current = 0 }
        }}
      >
      {plan ? <PlanPanel /> : month ? (
        <div className="monthgrid" aria-label="Month calendar" role="group">
          {weeks[0].map((d) => <span key={d} className="mono monthhead" aria-hidden="true">{DAY_SHORT[fromLocalDate(d).getDay()]}</span>)}
          {weeks.flat().map((d) => {
            const items = dueOn(d)
            const alpha = Math.min(0.45, (loadOf(d) / maxLoad) * 0.45)
            const fd = fromLocalDate(d)
            return (
              <button key={d} type="button" aria-pressed={selected === d} className={`mcell${d === today ? ' today' : ''}${sameMonth(d, anchor) ? '' : ' faded'}${selected === d ? ' selected' : ''}`}
                style={{ background: loadOf(d) > 0 ? `color-mix(in srgb, var(--accent) ${Math.round(alpha * 100)}%, var(--bg))` : undefined }}
                onClick={() => setSelected(selected === d ? null : d)}>
                <span className="num">{fd.getDate()}<span className="sr-only"> {DAY_SHORT[fd.getDay()]} {MONTH_SHORT[fd.getMonth()]}, {items.length} due</span></span>
                {items.slice(0, 2).map((a) => <span key={a.id} className="mchip"><i className="dot" style={{ background: courseOf(a)?.color }} />{a.title}</span>)}
                {items.length > 2 && <span className="sub">+{items.length - 2} more</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <WeekTimeline days={weeks[0]} today={today} now={now} courses={courses} assignments={assignments} blocks={blocks} settings={settings} loadOf={loadOf} maxLoad={maxLoad} />
      )}

      </div>

      {!plan && month && detail && (
        <section className="tile" style={{ marginTop: 16 }} aria-label={`Details for ${detail}`}>
          <h2>{relativeDay(detail, today)} · {detail}</h2>
          {classesOn(courses, detail, settings.rotationStart).map(({ course, meeting }) => (
            <p key={course.id + meeting.start}><i className="dot" style={{ background: course.color }} />{formatTime(meeting.start)} {course.name}</p>
          ))}
          {dueOn(detail).map((a) => <p key={a.id}><i className="dot" style={{ background: courseOf(a)?.color }} />Due: {a.title}</p>)}
          {classesOn(courses, detail, settings.rotationStart).length === 0 && dueOn(detail).length === 0 && <p className="sub">Nothing scheduled.</p>}
        </section>
      )}
    </>
  )
}
