import { computeStreak, weekProgress } from '../../domain/streaks'
import type { Hobby, Log, Pause } from '../../domain/types'
import { checkIn } from './actions'

/** Today screen: every hobby with its streak and a one-tap check-in. */
export function HabitsTile({ hobbies, logs, pauses, today, weekStart }: { hobbies: Hobby[]; logs: Log[]; pauses: Pause[]; today: string; weekStart: 0 | 1 }) {
  return (
    <section className="tile span-12" aria-label="Habits today">
      <h2>Habits</h2>
      <ul className="list">
        {hobbies.map((h) => {
          const streak = computeStreak({ hobby: h, logs, pauses, today, weekStart })
          const p = weekProgress(h, logs, today, weekStart)
          const done = logs.some((l) => l.hobbyId === h.id && l.localDate === today)
          return (
            <li key={h.id}>
              <i className="dot big" style={{ background: h.color }} />
              <span className="title"><b><a href={`#/life/${h.id}`}>{h.name}</a></b><span className="sub">{p.value} of {p.target} {p.unit} this week (since {weekStart === 1 ? 'Mon' : 'Sun'}) · {streak.current} {streak.unit}{streak.current === 1 ? '' : 's'} streak</span></span>
              <button className="btn" type="button" onClick={() => checkIn(h)}>{done ? 'Log another' : 'Check in'}</button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
