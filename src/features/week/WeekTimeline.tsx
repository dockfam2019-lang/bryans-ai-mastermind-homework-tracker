import { useEffect, useRef } from 'react'
import { repo } from '../../data'
import { DAY_SHORT, formatTime, fromLocalDate } from '../../domain/dates'
import { minutesOf } from '../../domain/energy'
import { classesOn } from '../../domain/schedule'
import { DEFAULT_STUDY_MINUTES, suggestPlan } from '../../domain/scheduler'
import type { Assignment, Course, Settings, StudyBlock } from '../../domain/types'
import { openAssignments } from '../../domain/upcoming'
import { showToast } from '../../ui/toast'

const START_H = 7
const END_H = 22
const hourOffset = (min: number) => `calc(${(min - START_H * 60) / 60} * var(--hour))`
const hourSpan = (min: number) => `calc(${min / 60} * var(--hour))`
const clampMin = (m: number) => Math.min(Math.max(m, START_H * 60), END_H * 60)

/**
 * One flowing week: days share an hour grid, classes are soft tinted blocks, timed due dates are flags,
 * and the planner's suggestions show as ghost chips you accept with a single tap.
 */
export function WeekTimeline({ days, today, now, courses, assignments, blocks, settings, loadOf, maxLoad }: {
  days: string[]; today: string; now: Date; courses: Course[]; assignments: Assignment[]; blocks: StudyBlock[]; settings: Settings
  loadOf: (d: string) => number; maxLoad: number
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const open = openAssignments(assignments)
  const courseOf = (a?: Assignment) => courses.find((c) => c.id === a?.courseId)
  const titleOf = (b: StudyBlock) => b.label ?? assignments.find((a) => a.id === b.assignmentId)?.title ?? 'Study'

  // live suggestions for the days still ahead; nothing is saved until one is tapped
  const perDay = settings.studyMinutesPerDay ?? DEFAULT_STUDY_MINUTES
  const kept = blocks.filter((b) => b.state !== 'suggested' || b.label).map((b) => (b.state === 'suggested' ? { ...b, state: 'accepted' as const } : b))
  const ghosts = suggestPlan({ assignments, existing: kept, today, perDay }).blocks.filter((b) => days.includes(b.date))

  // on narrow screens, start scrolled to today
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('.tday.is-today')
    const box = scroller.current
    if (el && box && box.scrollWidth > box.clientWidth) box.scrollLeft = el.offsetLeft - (box.querySelector<HTMLElement>('.tgutter')?.offsetWidth ?? 0)
  }, [days[0]])

  async function accept(g: (typeof ghosts)[number]) {
    const saved = await repo.studyBlocks.put({ ...g, state: 'accepted' })
    const a = assignments.find((x) => x.id === g.assignmentId)
    showToast(`Planned ${g.minutes} min for ${a?.title ?? 'study'}.`, { actionLabel: 'Undo', onAction: () => void repo.studyBlocks.remove(saved.id) })
  }

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
        const due = open.filter((a) => a.dueDate === d)
        const timedDue = due.filter((a) => a.dueTime)
        const untimedDue = due.filter((a) => !a.dueTime)
        const dayBlocks = blocks.filter((b) => b.date === d && (b.state === 'accepted' || b.state === 'done' || (b.state === 'suggested' && b.label)))
        const timedBlocks = dayBlocks.filter((b) => b.start)
        const loose = dayBlocks.filter((b) => !b.start)
        const allGhosts = ghosts.filter((g) => g.date === d)
        const dayGhosts = allGhosts.slice(0, 2)
        return (
          <section key={d} className={`tday${isToday ? ' is-today' : ''}${d < today ? ' is-past' : ''}`} aria-label={`${DAY_SHORT[fd.getDay()]} ${fd.getDate()}`}>
            <header className="thead">
              <span className="mono">{DAY_SHORT[fd.getDay()]}</span>
              <b className="wide">{fd.getDate()}</b>
              <i className="glow" role="img" aria-label={`${load} minutes of work`} style={{ opacity: load === 0 ? 0.12 : 0.35 + Math.min(1, load / maxLoad) * 0.65, width: `${30 + Math.min(1, load / maxLoad) * 70}%` }} />
            </header>
            <div className="tlane">
              {untimedDue.map((a) => <span key={a.id} className="chip due" style={{ ['--c' as string]: courseOf(a)?.color }} title={`${a.title}, due`}>{a.title}</span>)}
              {loose.map((b) => <span key={b.id} className={`chip study${b.state === 'done' ? ' done' : ''}`} title={`${titleOf(b)}, ${b.minutes} min`}>{b.minutes}m · {titleOf(b)}</span>)}
              {dayGhosts.map((g) => {
                const a = assignments.find((x) => x.id === g.assignmentId)
                return (
                  <button key={g.assignmentId} type="button" className="chip ghost" onClick={() => accept(g)} title="Suggested by the planner. Tap to add it.">
                    + {g.minutes}m {a?.title ?? 'Study'}<span className="sr-only">, suggested study time. Add to plan.</span>
                  </button>
                )
              })}
              {allGhosts.length > dayGhosts.length && <a className="chip more" href="#/week/plan">+{allGhosts.length - dayGhosts.length} more in Plan</a>}
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
                return <div key={b.id} className="tblock study" style={{ top: hourOffset(s), height: hourSpan(Math.max(30, b.minutes)) }}><b>{titleOf(b)}</b><span>{formatTime(b.start!)} · {b.minutes}m</span></div>
              })}
              {timedDue.map((a) => (
                <div key={a.id} className="tflag" style={{ top: hourOffset(clampMin(minutesOf(a.dueTime!))), ['--c' as string]: courseOf(a)?.color }}>
                  <span>{formatTime(a.dueTime!)} due</span><b>{a.title}</b>
                </div>
              ))}
              {isToday && nowMin >= START_H * 60 && nowMin <= END_H * 60 && <div className="tnow" style={{ top: hourOffset(nowMin) }} aria-hidden="true" />}
            </div>
          </section>
        )
      })}
    </div>
  )
}
