import { repo } from '../../data'
import { summarizeOnTime, recentByType } from '../../domain/attendance'
import { addDays, DAY_SHORT, dueAt, formatCountdown, formatTime, fromLocalDate, MONTH_SHORT, relativeDay, startOfWeek, toLocalDate } from '../../domain/dates'
import { loadByDay, peakDay } from '../../domain/load'
import type { Assignment, Course } from '../../domain/types'
import { dueOn, nextUp, openAssignments, overdue } from '../../domain/upcoming'
import { useLive, useNow } from '../../ui/hooks'
import { PulseChart } from './PulseChart'

const HEAT_WEEKS = 10

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

  if (!assignments || !courses || !attendance || !hobbies || !logs) return null

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
  const hobby = hobbies.find((h) => !h.archived)
  const d = fromLocalDate(today)
  const dueCount = dueToday.length + late.length

  // hobby heat: last HEAT_WEEKS weeks, ending today, column per week
  const minutesByDate = new Map<string, number>()
  for (const l of logs) if (hobby && l.hobbyId === hobby.id) minutesByDate.set(l.localDate, (minutesByDate.get(l.localDate) ?? 0) + (l.durationMin ?? 20))
  const heatStart = addDays(startOfWeek(today, 0), -(HEAT_WEEKS - 1) * 7) // columns are calendar weeks
  const cells = Array.from({ length: HEAT_WEEKS * 7 }, (_, i) => addDays(heatStart, i))
  const level = (m: number) => (m === 0 ? 0 : m < 20 ? 1 : m < 30 ? 2 : m < 45 ? 3 : 4)
  const sessions = cells.filter((c) => (minutesByDate.get(c) ?? 0) > 0).length

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

        {hobby && (
          <section className="tile span-12" aria-label={`${hobby.name} practice`}>
            <h2>{`${hobby.name} · last ${HEAT_WEEKS} weeks`}</h2>
            <div className="heat" style={{ gridTemplateColumns: `repeat(${HEAT_WEEKS}, 1fr)`, maxWidth: 520 }} role="img" aria-label={`${sessions} sessions in ${HEAT_WEEKS} weeks`}>
              {cells.map((c) => <i key={c} className={`l${level(minutesByDate.get(c) ?? 0)}`} style={c > today ? { opacity: 0.35 } : undefined} title={c} />)}
            </div>
            <p className="sub">{sessions} sessions. Streaks and stats arrive in Phase 3.</p>
          </section>
        )}
      </div>
    </>
  )
}
