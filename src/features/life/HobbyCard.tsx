import { cadenceLabel, heatCells } from '../../domain/hobbies'
import { computeStreak, freezesLeft, weekProgress } from '../../domain/streaks'
import type { Hobby, Log, Pause } from '../../domain/types'
import { checkIn, freezeYesterday } from './actions'
import { HeatGrid } from './HeatGrid'

export interface HobbyData { logs: Log[]; pauses: Pause[]; today: string; weekStart: 0 | 1 }

export function HobbyCard({ hobby, data, onDetails }: { hobby: Hobby; data: HobbyData; onDetails: (h: Hobby) => void }) {
  const { logs, pauses, today, weekStart } = data
  const mine = logs.filter((l) => l.hobbyId === hobby.id)
  const streak = computeStreak({ hobby, logs, pauses, today, weekStart })
  const progress = weekProgress(hobby, logs, today, weekStart)
  const loggedToday = mine.some((l) => l.localDate === today)
  const { left } = freezesLeft(pauses.filter((p) => p.hobbyId === hobby.id || p.hobbyId === '*'), today)
  const pct = Math.min(100, Math.round((progress.value / Math.max(1, progress.target)) * 100))

  return (
    <article className="tile hobbycard span-6" aria-label={hobby.name}>
      <header className="hobbyhead">
        <i className="dot big" style={{ background: hobby.color }} />
        <div>
          <h3><a href={`#/life/${hobby.id}`}>{hobby.name}</a></h3>
          <p className="sub">{cadenceLabel(hobby.cadence)}{hobby.goal ? ` · ${hobby.goal}` : ''}</p>
        </div>
        <div className="streak">
          <div className="wide num">{streak.current}</div>
          <span className="mono">{streak.unit}{streak.current === 1 ? '' : 's'} · best {streak.best}</span>
        </div>
      </header>

      <div className="progress">
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <span className="sub">{progress.value} of {progress.target} {progress.unit} this week</span>
      </div>

      <HeatGrid cells={heatCells(mine, today, 20, weekStart)} today={today} label={`${hobby.name} last 20 weeks`} columns={20} />

      {streak.atRisk && (
        <p className="sub note">
          One missed {streak.unit} is just data. Two in a row ends a streak, so today is a good day.
          {streak.unit === 'day' && left > 0 && <> <button className="linkbtn" type="button" onClick={() => freezeYesterday(hobby, today)}>Use a freeze for yesterday ({left} left)</button></>}
        </p>
      )}

      <div className="actions">
        <button className="btn" type="button" onClick={() => checkIn(hobby)}>{loggedToday ? 'Log another' : 'Check in'}</button>
        <button className="btn ghost" type="button" onClick={() => onDetails(hobby)}>Add details</button>
      </div>
    </article>
  )
}

