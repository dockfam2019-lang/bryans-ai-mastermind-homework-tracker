import { useEffect, useRef } from 'react'
import { DAY_SHORT, formatTime, fromLocalDate } from '../../domain/dates'
import { minutesOf } from '../../domain/energy'
import type { Suggestion } from '../../domain/livePlan'
import { classesOn } from '../../domain/schedule'
import { itemStatus } from '../../domain/status'
import type { Assignment, Course, Settings, StudyBlock } from '../../domain/types'
import { acceptSuggestion } from '../plan/usePlan'

const START_H = 7
const END_H = 22
const hourOffset = (min: number) => `calc(${(min - START_H * 60) / 60} * var(--hour))`
const hourSpan = (min: number) => `calc(${min / 60} * var(--hour))`
const clampMin = (m: number) => Math.min(Math.max(m, START_H * 60), END_H * 60)

/**
 * One flowing week: days share an hour grid, classes are soft tinted blocks, due items sit in the top lane
 * (timed ones also get a thin tick at their due time),
 * and suggested study time appears as dashed ghost blocks at real free times. One tap plans one.
 */
export function WeekTimeline({ days, today, now, courses, assignments, blocks, suggestions, settings, loadOf, maxLoad }: {
  days: string[]; today: string; now: Date; courses: Course[]; assignments: Assignment[]; blocks: StudyBlock[]; suggestions: Suggestion[]; settings: Settings
  loadOf: (d: string) => number; maxLoad: number
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const courseOf = (a?: Assignment) => courses.find((c) => c.id === a?.courseId)
  const titleOf = (id: string, label?: string) => label ?? assignments.find((a) => a.id === id)?.title ?? 'Study'

  // on narrow screens, start scrolled to today
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('.tday.is-today')
    const box = scroller.current
    if (el && box && box.scrollWidth > box.clientWidth) box.scrollLeft = el.offsetLeft - (box.querySelector<HTMLElement>('.tgutter')?.offsetWidth ?? 0)
  }, [days[0]])

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)

  return (
    <div className="timeline" ref={scroller}>
      <div className="tgutter" aria-hidden="true">
        <div className="thead" />
        <div className="tlane" />
        <div className="tbody">{hours.map((h) => <span key={h} style={{ top: hourOffset(h * 60) }}>{h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'a' : 'p'}</span>)}</div>
      </div>
      {days.map((d) => {
        const fd = fromLocalDate(d)
        const isToday = d === today
        const load = loadOf(d)
        const classes = classesOn(courses, d, settings.rotationStart)
        const due = assignments.filter((a) => a.status !== 'done' && a.dueDate === d)
        const timedDue = due.filter((a) => a.dueTime).sort((x, y) => x.dueTime!.localeCompare(y.dueTime!))
        const untimedDue = due.filter((a) => !a.dueTime)
        const dayBlocks = blocks.filter((b) => b.date === d && (b.state === 'accepted' || b.state === 'done'))
        const timedBlocks = dayBlocks.filter((b) => b.start)
        const loose = dayBlocks.filter((b) => !b.start)
        const daySuggestions = suggestions.filter((s) => s.date === d)
        return (
          <section key={d} className={`tday${isToday ? ' is-today' : ''}${d < today ? ' is-past' : ''}`} aria-label={`${DAY_SHORT[fd.getDay()]} ${fd.getDate()}`}>
            <header className="thead">
              <span className="mono">{DAY_SHORT[fd.getDay()]}</span>
              <b className="wide">{fd.getDate()}</b>
              <i className="glow" role="img" aria-label={`About ${load} minutes of work`} style={{ opacity: load === 0 ? 0.12 : 0.35 + Math.min(1, load / maxLoad) * 0.65, width: `${30 + Math.min(1, load / maxLoad) * 70}%` }} />
            </header>
            <div className="tlane">
              {/* due items live in the lane, earliest first, so they never sit on top of a class or each other */}
              {[...timedDue, ...untimedDue].map((a) => (
                <span key={a.id} className={`chip due${itemStatus(a, now) === 'overdue' ? ' late' : ''}`} style={{ ['--c' as string]: courseOf(a)?.color }} title={`${a.title}, due${a.dueTime ? ` ${formatTime(a.dueTime)}` : ''}`}>
                  {itemStatus(a, now) === 'overdue' && <b className="tag-overdue">Overdue </b>}{a.dueTime && <small className="mono">Due {formatTime(a.dueTime)} · </small>}{a.title}
                </span>
              ))}
              {loose.map((b) => <span key={b.id} className={`chip study${b.state === 'done' ? ' done' : ''}`} title={`${titleOf(b.assignmentId, b.label)}, ${b.minutes} min`}>{b.minutes}m · {titleOf(b.assignmentId, b.label)}</span>)}
              {daySuggestions.filter((s) => !s.start).map((s) => (
                <button key={s.key} type="button" className="chip ghost" onClick={() => acceptSuggestion(s, titleOf(s.assignmentId, s.label))}>
                  + {s.minutes}m {titleOf(s.assignmentId, s.label)}<span className="sr-only">, suggested for {DAY_SHORT[fd.getDay()]}. Add to plan.</span>
                </button>
              ))}
            </div>
            <div className="tbody">
              {classes.map(({ course, meeting }) => {
                const s = clampMin(minutesOf(meeting.start)), e = clampMin(minutesOf(meeting.end))
                return (
                  <div key={course.id + meeting.start} className="tblock" style={{ top: hourOffset(s), height: hourSpan(Math.max(30, e - s)), ['--c' as string]: course.color }}>
                    <b>{course.name}</b><span>{formatTime(meeting.start)}{meeting.room ? ` · ${meeting.room}` : ''}</span>
                  </div>
                )
              })}
              {timedBlocks.map((b) => {
                const s = clampMin(minutesOf(b.start!))
                return <div key={b.id} className={`tblock study${b.state === 'done' ? ' done' : ''}${b.minutes < 40 ? ' short' : ''}`} style={{ top: hourOffset(s), height: hourSpan(Math.max(26, b.minutes)) }}><b>{titleOf(b.assignmentId, b.label)}</b><span>{formatTime(b.start!)} · {b.minutes}m</span></div>
              })}
              {daySuggestions.filter((s) => s.start).map((s) => {
                const start = clampMin(minutesOf(s.start!))
                const title = titleOf(s.assignmentId, s.label)
                return (
                  <button key={s.key} type="button" className={`tblock ghost${s.minutes < 60 ? ' short' : ''}`} style={{ top: hourOffset(start), height: hourSpan(Math.max(30, s.minutes)) }} onClick={() => acceptSuggestion(s, title)} title={`Suggested: ${title}, ${formatTime(s.start!)}, ${s.minutes} min. Tap to plan it.`}>
                    <b>+ {title}</b><span>{formatTime(s.start!)} · {s.minutes}m</span><span className="sr-only">, suggested for {DAY_SHORT[fd.getDay()]}. Add to plan.</span>
                  </button>
                )
              })}
              {/* a thin tick marks the due time on the grid; the name is in the lane above */}
              {timedDue.map((a) => (
                <i key={a.id} className={`tdue${itemStatus(a, now) === 'overdue' ? ' late' : ''}`} aria-hidden="true" title={`${a.title}, due ${formatTime(a.dueTime!)}`} style={{ top: hourOffset(clampMin(minutesOf(a.dueTime!))), ['--c' as string]: courseOf(a)?.color }} />
              ))}
              {isToday && nowMin >= START_H * 60 && nowMin <= END_H * 60 && <div className="tnow" style={{ top: hourOffset(nowMin) }} aria-hidden="true" />}
            </div>
          </section>
        )
      })}
    </div>
  )
}
