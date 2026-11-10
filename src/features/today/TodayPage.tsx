import { repo } from '../../data'
import { summarizeOnTime, recentByType } from '../../domain/attendance'
import { DAY_SHORT, dueAt, formatCountdown, formatTime, fromLocalDate, MONTH_SHORT, relativeDay, toLocalDate } from '../../domain/dates'
import { examCards } from '../../domain/exams'
import { loadByDay, peakDay } from '../../domain/load'
import { classesOn } from '../../domain/schedule'
import type { Assignment, Course } from '../../domain/types'
import { dueOn, nextUp, openAssignments, overdue } from '../../domain/upcoming'
import { useLive, useNow } from '../../ui/hooks'
import { HabitsTile } from '../life/HabitsTile'
import { PulseChart } from './PulseChart'

function markDone(a: Assignment) {
  return repo.assignments.put({ ...a, status: 'done', progress: 1, completedAt: Date.now() })
}

export function TodayPage() {
  const now = useNow()
  const today = toLocalDate(now)
  const assignments = useLive(() => repo.assignments.all())
  const courses = useLive(() => repo.courses.all())
  const attendance = useLive(() => repo.attendance.all())
  const hobbies = useLive(() => repo.hobbies.all())
  const logs = useLive(() => repo.logs.all())
  const settings = useLive(() => repo.settings.get('main'))
  const pauses = useLive(() => repo.pauses.all())

  if (!assignments || !courses || !attendance || !hobbies || !logs || !settings || !pauses) return null

  const courseOf = (a: Assignment): Course | undefined => courses.find((c) => c.id === a.courseId)
  const next = nextUp(assignments, now)
  const dueToday = dueOn(assignments, today)
  const late = overdue(assignments, now)
  const open = openAssignments(assignments)
  const load = loadByDay(assignments, today, 14)
  const peak = peakDay(load)
  const plannedHours = Math.round(load.reduce((sum, d) => sum + d.minutes, 0) / 6) / 10
  const devotional = recentByType(attendance, 'devotional', 10)
  const onTime = summarizeOnTime(devotional)
  const habits = hobbies.filter((h) => !h.archived)
  const d = fromLocalDate(today)
  const dueCount = dueToday.length + late.length
  const classes = classesOn(courses, today, settings.rotationStart)
  const exams = examCards(assignments, today)

  const nextCourse = next ? courseOf(next) : undefined
  const nextAt = next ? dueAt(next.dueDate, next.dueTime) : undefined
  const countdown = nextAt ? formatCountdown(nextAt.getTime() - now.getTime()) : ''
  const [timeBig, timeSuffix] = next?.dueTime ? formatTime(next.dueTime).split(' ') : [next ? relativeDay(next.dueDate, today) : '', '']

  return (
    <>
      <div className="pagehead">
        <p className="mono">{`${DAY_SHORT[d.getDay()]} · ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`}</p>
        <h1>{dueCount === 0 ? 'Nothing due today.' : `${dueCount} due today.`}</h1>
        {late.length > 0 && <p>{late.length} earlier {late.length === 1 ? 'item is' : 'items are'} waiting. No rush, just pick one.</p>}
      </div>

      <div className="bento">
        <section className="tile glass hero span-6 row-2" aria-label="Next up">
          {next ? (
            <>
              <h2>{`Next up · ${countdown === 'overdue' ? 'waiting for you' : `in ${countdown}`}`}</h2>
              <div className="wide big">{timeBig}{timeSuffix && <small>{timeSuffix}</small>}</div>
              <h3>{next.title}</h3>
              <div className="meta">
                <span><i className="dot" style={{ background: nextCourse?.color }} />{nextCourse?.name ?? 'No course'}</span>
                <span>{next.estimatedMinutes ? `~${next.estimatedMinutes} min` : 'no estimate'}</span>
                {next.difficulty && <span>{`difficulty ${next.difficulty}/5`}</span>}
              </div>
              <button className="btn" type="button" style={{ marginTop: 'auto' }} onClick={() => markDone(next)}>Mark done</button>
            </>
          ) : (
            <>
              <h2>Next up</h2>
              <h3>All clear.</h3>
              <p className="sub">Nothing is waiting. Add an assignment in School, or enjoy the evening.</p>
            </>
          )}
        </section>

        <section className="tile span-3" aria-label="Due today">
          <h2>Due today</h2>
          <div className="wide stat">{dueCount}</div>
          <p className="sub">{dueCount === 0 ? 'A clear day.' : [...late, ...dueToday].slice(0, 2).map((a) => a.title).join(' · ')}</p>
        </section>

        <section className="tile span-3" aria-label="Devotional on time">
          <h2>Devotional on time</h2>
          <div className="wide stat">{onTime.pct === null ? '–' : `${onTime.pct}%`}</div>
          <div className="ondots" aria-label={`${onTime.onTime} of ${onTime.total} recent devotionals on time`}>
            {devotional.map((r) => <i key={r.id} className={r.status === 'on-time' ? '' : r.status} title={`${r.localDate}: ${r.status}`} />)}
          </div>
        </section>

        <section className="tile span-6" aria-label="Classes today">
          <h2>Classes today</h2>
          {classes.length === 0 ? <p className="sub">No classes today. Add your timetable under School, Courses.</p> : (
            <ul className="list">
              {classes.map(({ course, meeting }) => (
                <li key={course.id + meeting.start}>
                  <i className="dot big" style={{ background: course.color }} />
                  <span className="title"><b>{course.name}</b><span className="sub">{meeting.room ?? ''}</span></span>
                  <span className="sub">{formatTime(meeting.start)} to {formatTime(meeting.end)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {exams.length > 0 && (
          <section className="tile span-6" aria-label="Exam countdown">
            <h2>Exam countdown</h2>
            {exams.slice(0, 2).map(({ assignment: a, daysLeft, stage }) => (
              <div key={a.id} className={`exam ${stage}`}>
                <div className="wide stat">{daysLeft}</div>
                <div>
                  <b>{daysLeft === 0 ? 'Exam today' : daysLeft === 1 ? 'day to go' : 'days to go'}</b>
                  <p className="sub">{a.title}{courseOf(a) ? ` · ${courseOf(a)?.name}` : ''}</p>
                  <p className="sub">{stage === 'upcoming' ? 'Plenty of time. A little each day.' : stage === 'soon' ? 'Time to start reviewing.' : stage === 'tomorrow' ? 'Tomorrow. Light review, then rest.' : 'You have prepared. Go.'}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="tile span-6" aria-label="Week load">
          <h2>Next 14 days</h2>
          <div className="wide stat">{plannedHours}<small className="sub" style={{ fontSize: '0.3em', marginLeft: 8 }}>HOURS PLANNED</small></div>
          <PulseChart load={load} today={today} peak={peak} />
        </section>

        <section className="tile span-6" aria-label="Due soon">
          <h2>Due soon</h2>
          {open.length === 0 ? <p className="sub">Nothing open. Nice.</p> : (
            <ul className="list">
              {open.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <button className="check" type="button" aria-label={`Mark ${a.title} done`} onClick={() => markDone(a)} />
                  <span className="title"><b>{a.title}</b><span className="sub"><i className="dot" style={{ background: courseOf(a)?.color }} />{courseOf(a)?.name}</span></span>
                  <span className="sub">{relativeDay(a.dueDate, today)}{a.dueTime ? ` ${formatTime(a.dueTime)}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {habits.length > 0 && <HabitsTile hobbies={habits} logs={logs} pauses={pauses} today={today} weekStart={settings.weekStart} />}
      </div>
    </>
  )
}
