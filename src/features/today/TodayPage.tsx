import { repo } from '../../data'
import { summarizeOnTime, recentByType } from '../../domain/attendance'
import { countdownWords, DAY_SHORT, dueAt, formatHM, formatTime, fromLocalDate, minutesOfDay, MONTH_SHORT, relativeDay, toLocalDate } from '../../domain/dates'
import { examCards } from '../../domain/exams'
import { loadByDay, peakDay } from '../../domain/load'
import { classesOn } from '../../domain/schedule'
import type { Assignment, Course } from '../../domain/types'
import { bucketize } from '../../domain/status'
import { useLive, useNow } from '../../ui/hooks'
import { startFocus } from '../focus/focusStore'
import { computeXp, levelFor, weeklyQuests } from '../../domain/game'
import { computeStreak } from '../../domain/streaks'
import { HabitsTile } from '../life/HabitsTile'
import { createPrepBlocks, markBlockDone } from '../plan/planActions'
import { acceptSuggestion, usePlan } from '../plan/usePlan'
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
  const blocks = useLive(() => repo.studyBlocks.all())
  const focusAll = useLive(() => repo.focusSessions.all())
  const readingAll = useLive(() => repo.readingItems.all())
  const cardsAll = useLive(() => repo.cards.all())
  const plan = usePlan()

  if (!assignments || !courses || !attendance || !hobbies || !logs || !settings || !pauses || !blocks || !focusAll || !readingAll || !cardsAll || !plan) return null

  const courseOf = (a: Assignment): Course | undefined => courses.find((c) => c.id === a.courseId)
  // one shared rule decides overdue / due today / upcoming, so every screen agrees
  const { overdue: late, dueToday, upcoming } = bucketize(assignments, now)
  const next = dueToday[0] ?? upcoming[0]
  const open = [...late, ...dueToday, ...upcoming]
  const load = loadByDay(assignments, today, 14)
  const peak = peakDay(load)
  const workAhead = load.reduce((sum, d) => sum + d.minutes, 0)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const devotional = recentByType(attendance, 'devotional', 10)
  const onTime = summarizeOnTime(devotional)
  const habits = hobbies.filter((h) => !h.archived)
  const d = fromLocalDate(today)
  const classes = classesOn(courses, today, settings.rotationStart)
  const exams = examCards(assignments, today)
  const gameOn = settings.gameEnabled
  const game = gameOn ? {
    assignments, focusSessions: focusAll, logs, attendance, readingItems: readingAll, today, weekStart: settings.weekStart,
    bestStreak: Math.max(0, ...habits.map((h) => computeStreak({ hobby: h, logs, pauses, today, weekStart: settings.weekStart }).best)),
  } : null
  const xp = game ? computeXp(game) : 0
  const lv = levelFor(xp)
  const quests = game ? weeklyQuests(game) : []
  const cardsDue = cardsAll.filter((c) => c.due <= today).length
  const todaysBlocks = blocks.filter((b) => b.date === today && (b.state === 'accepted' || b.state === 'done')).sort((a, b) => (a.start ?? '99').localeCompare(b.start ?? '99'))
  const todaysSuggestions = plan.suggestions.filter((x) => x.date === today).sort((a, b) => (a.start ?? '99').localeCompare(b.start ?? '99'))
  const firstFuture = classes.findIndex(({ meeting }) => minutesOfDay(meeting.start) > nowMin)

  const nextCourse = next ? courseOf(next) : undefined
  const nextAt = next ? dueAt(next.dueDate, next.dueTime) : undefined
  const countdown = nextAt ? countdownWords(nextAt.getTime() - now.getTime()) : ''
  // the big text always says when: "2:10 pm" today, otherwise the day ("Fri") with the time beside it
  const isToday = next?.dueDate === today
  const timeBig = next ? (isToday ? (next.dueTime ? formatTime(next.dueTime).split(' ')[0] : 'Today') : relativeDay(next.dueDate, today)) : ''
  const timeSuffix = next?.dueTime ? (isToday ? formatTime(next.dueTime).split(' ')[1] : formatTime(next.dueTime)) : ''
  // an exam item called "Unit 5 exam prep" counts down to the exam itself
  const examName = (title: string) => title.replace(/\s+prep$/i, '')

  return (
    <>
      <div className="pagehead">
        <p className="mono">{`${DAY_SHORT[d.getDay()]} · ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`}</p>
        <h1>{dueToday.length === 0 ? 'Nothing due today.' : `${dueToday.length} due today.`}</h1>
        {late.length > 0 && <p><span className="tag-overdue">Overdue</span> {late.map((a) => a.title).join(', ')}. Catch up when you can, or mark it done below.</p>}
      </div>

      <div className="bento">
        <section className="tile glass hero span-6 row-2" aria-label="Next up">
          {next ? (
            <>
              <h2>{`Next up · due ${isToday ? 'today' : relativeDay(next.dueDate, today)}, ${countdown}`}</h2>
              <div className="wide big">{timeBig}{timeSuffix && <small>{timeSuffix}</small>}</div>
              <h3>{next.title}</h3>
              <div className="meta">
                <span><i className="dot" style={{ background: nextCourse?.color }} />{nextCourse?.name ?? 'No course'}</span>
                <span>{next.estimatedMinutes ? `~${next.estimatedMinutes} min` : 'no estimate'}</span>
                {next.difficulty && <span>{`difficulty ${next.difficulty}/5`}</span>}
              </div>
              <div className="actions" style={{ marginTop: 'auto' }}>
                <button className="btn" type="button" onClick={() => startFocus({ type: 'assignment', id: next.id, title: next.title }, { quick: true })}>Start for 5 minutes</button>
                <button className="btn ghost" type="button" onClick={() => markDone(next)}>Mark done</button>
              </div>
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
          <div className="wide stat">{dueToday.length}</div>
          <p className="sub">{dueToday.length === 0 ? 'A clear day.' : dueToday.slice(0, 2).map((a) => a.title).join(' · ')}</p>
          {late.length > 0 && <p className="sub"><span className="tag-overdue">+ {late.length} overdue</span></p>}
        </section>

        <section className="tile span-3" aria-label="Devotional on time">
          <h2>Devotional on time</h2>
          <div className="wide stat">{onTime.pct === null ? '–' : `${onTime.pct}%`}</div>
          <div className="ondots" role="img" aria-label={`${onTime.onTime} of ${onTime.total} recent devotionals on time`}>
            {devotional.map((r) => <i key={r.id} className={r.status === 'on-time' ? '' : r.status} title={`${r.localDate}: ${r.status}`} />)}
          </div>
        </section>

        <section className="tile span-6" aria-label="Study blocks today">
          <h2>Study blocks today</h2>
          {todaysBlocks.length + todaysSuggestions.length === 0 ? <p className="sub">Nothing planned or suggested for today.</p> : (
            <ul className="list">
              {todaysSuggestions.map((x) => {
                const a = assignments.find((y) => y.id === x.assignmentId)
                const title = x.label ?? a?.title ?? 'Study'
                return (
                  <li key={x.key} className="is-suggested">
                    <i className="dot big" style={{ background: a ? courseOf(a)?.color : 'var(--muted)' }} />
                    <span className="title"><b>{title}</b><span className="sub">{x.start ? `${formatTime(x.start)} · ` : ''}{x.minutes} min · suggested</span></span>
                    <button className="btn ghost" type="button" onClick={() => acceptSuggestion(x, title)}>Accept<span className="sr-only"> {title}</span></button>
                  </li>
                )
              })}
              {todaysBlocks.map((b) => {
                const a = assignments.find((x) => x.id === b.assignmentId)
                return (
                  <li key={b.id} className={b.state === 'done' ? 'is-done' : ''}>
                    <i className="dot big" style={{ background: a ? courseOf(a)?.color : 'var(--muted)' }} />
                    <span className="title"><b>{b.label ?? a?.title ?? 'Study'}</b><span className="sub">{b.start ? `${formatTime(b.start)} · ` : ''}{b.minutes} min</span></span>
                    {b.state === 'accepted' && a && <button className="btn" type="button" onClick={() => startFocus({ type: 'assignment', id: a.id, title: a.title })}>Start</button>}
                    {b.state === 'accepted' && <button className="btn ghost" type="button" onClick={() => markBlockDone(b)}>Done</button>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="tile span-6" aria-label="Classes today">
          <h2>Classes today</h2>
          {classes.length === 0 ? <p className="sub">No classes today. Add your timetable under School, Courses.</p> : (
            <ul className="list">
              {classes.map(({ course, meeting }, i) => {
                const past = minutesOfDay(meeting.end) <= nowMin
                const current = !past && minutesOfDay(meeting.start) <= nowMin
                const isNext = i === firstFuture && !classes.some(({ meeting: m }) => minutesOfDay(m.start) <= nowMin && minutesOfDay(m.end) > nowMin)
                return (
                  <li key={course.id + meeting.start} className={past ? 'class-past' : current ? 'class-now' : isNext ? 'class-next' : ''}>
                    <i className="dot big" style={{ background: course.color }} />
                    <span className="title"><b>{course.name}</b><span className="sub">{meeting.room ?? ''}</span></span>
                    {past && <span className="mono">Done ✓</span>}{current && <span className="tag-now">Now</span>}{isNext && <span className="mono">Next</span>}
                    <span className="sub">{formatTime(meeting.start)} to {formatTime(meeting.end)}</span>
                  </li>
                )
              })}
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
                  <b>{daysLeft === 0 ? `${examName(a.title)} is today` : `${daysLeft === 1 ? 'day' : 'days'} until ${examName(a.title)}`}</b>
                  <p className="sub">{relativeDay(a.dueDate, today)}{a.dueTime ? ` ${formatTime(a.dueTime)}` : ''}{courseOf(a) ? ` · ${courseOf(a)?.name}` : ''}</p>
                  <p className="sub"><button className="linkbtn" type="button" onClick={() => createPrepBlocks(a, today)}>Plan my prep</button></p>
                  <p className="sub">{stage === 'upcoming' ? 'Plenty of time. A little each day.' : stage === 'soon' ? 'Time to start reviewing.' : stage === 'tomorrow' ? 'Tomorrow. Light review, then rest.' : 'You have prepared. Go.'}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {cardsDue > 0 && (
          <section className="tile span-6" aria-label="Flashcards due">
            <h2>Flashcards due</h2>
            <div className="wide stat">{cardsDue}</div>
            <p className="sub"><a href="#/school/cards">Review them</a>. A few minutes now saves an hour before the exam.</p>
          </section>
        )}

        {game && (
          <section className="tile span-6" aria-label="Level and quests">
            <h2>Level {lv.level}</h2>
            <div className="bar" role="progressbar" aria-valuenow={Math.round(lv.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level"><i style={{ width: `${lv.progress * 100}%` }} /></div>
            <p className="sub">{xp} XP · {lv.next - xp} to level {lv.level + 1}</p>
            <p className="sub">{quests.filter((q) => q.done).length} of {quests.length} weekly quests done. <a href="#/insights/game">See all</a></p>
          </section>
        )}

        <section className="tile span-6" aria-label="Week load">
          <h2>Work ahead, next 14 days</h2>
          <div className="statline"><span className="wide stat">{formatHM(workAhead)}</span><span className="mono">estimated from open assignments</span></div>
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
                  <span className="sub right">{late.includes(a) && <span className="tag-overdue">Overdue · </span>}{relativeDay(a.dueDate, today)}{a.dueTime ? ` ${formatTime(a.dueTime)}` : ''}</span>
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
