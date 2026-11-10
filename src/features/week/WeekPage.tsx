import { useState } from 'react'
import { repo } from '../../data'
import { addDays, DAY_SHORT, formatTime, fromLocalDate, MONTH_SHORT, relativeDay, startOfWeek, toLocalDate, weekDates } from '../../domain/dates'
import { monthGrid, sameMonth, shiftMonth } from '../../domain/calendar'
import { loadByDay } from '../../domain/load'
import { classesOn } from '../../domain/schedule'
import type { Assignment, Course } from '../../domain/types'
import { openAssignments } from '../../domain/upcoming'
import { useLive, useNow } from '../../ui/hooks'
import { PlanPanel } from '../plan/PlanPanel'

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

  if (!assignments || !courses || !settings || !blocks) return null
  const weekStart = settings.weekStart
  const open = openAssignments(assignments)
  const courseOf = (a: Assignment): Course | undefined => courses.find((c) => c.id === a.courseId)
  const dueOn = (d: string) => open.filter((a) => a.dueDate === d)

  const month = tab === 'month'
  const plan = tab === 'plan'
  const blocksOn = (d: string) => blocks.filter((b) => b.date === d && (b.state === 'accepted' || b.state === 'done'))
  const weeks = month ? monthGrid(anchor, weekStart) : [weekDates(anchor, weekStart)]
  const first = weeks[0][0]
  const gridLoad = loadByDay(assignments, first, weeks.length * 7)
  const loadOf = (d: string) => gridLoad.find((x) => x.date === d)?.minutes ?? 0
  const maxLoad = Math.max(60, ...gridLoad.map((d) => d.minutes))

  const move = (delta: number) => setAnchor(month ? shiftMonth(anchor, delta) : addDays(anchor, delta * 7))
  const label = month
    ? `${MONTH_SHORT[fromLocalDate(anchor).getMonth()]} ${fromLocalDate(anchor).getFullYear()}`
    : `${relativeDay(startOfWeek(anchor, weekStart), today)} – ${relativeDay(addDays(startOfWeek(anchor, weekStart), 6), today)}`

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
        {!plan && <>
          <button className="btn ghost" type="button" onClick={() => move(-1)} aria-label={month ? 'Previous month' : 'Previous week'}>‹</button>
          <button className="btn ghost" type="button" onClick={() => setAnchor(today)}>Today</button>
          <button className="btn ghost" type="button" onClick={() => move(1)} aria-label={month ? 'Next month' : 'Next week'}>›</button>
        </>}
      </nav>

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
        <div className="weekgrid">
          {weeks[0].map((d) => {
            const classes = classesOn(courses, d, settings.rotationStart)
            const items = dueOn(d)
            return (
              <section key={d} className={`daycol${d === today ? ' today' : ''}`} aria-label={d}>
                <header><span className="mono">{DAY_SHORT[fromLocalDate(d).getDay()]}</span><b>{fromLocalDate(d).getDate()}</b></header>
                <div className="loadbar" role="img" aria-label={`${loadOf(d)} minutes of work`}><i style={{ width: `${Math.min(100, (loadOf(d) / maxLoad) * 100)}%` }} /></div>
                {classes.map(({ course, meeting }) => (
                  <div key={course.id + meeting.start} className="slot class"><i className="dot" style={{ background: course.color }} /><span>{formatTime(meeting.start)}</span><b>{course.name}</b></div>
                ))}
                {items.map((a) => (
                  <div key={a.id} className="slot due"><i className="dot" style={{ background: courseOf(a)?.color }} /><span>{a.dueTime ? formatTime(a.dueTime) : 'due'}</span><b>{a.title}</b></div>
                ))}
                {blocksOn(d).map((b) => (
                  <div key={b.id} className="slot study"><i className="dot" style={{ background: 'var(--accent-3)' }} /><span>{b.minutes}m</span><b>{b.label ?? open.find((a) => a.id === b.assignmentId)?.title ?? 'Study'}</b></div>
                ))}
                {classes.length === 0 && items.length === 0 && blocksOn(d).length === 0 && <p className="sub">Free</p>}
              </section>
            )
          })}
        </div>
      )}

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
