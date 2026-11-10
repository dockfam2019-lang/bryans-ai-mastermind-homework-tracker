import { cadenceLabel, heatCells, hobbyStats, weeklyReview } from '../../domain/hobbies'
import { DAY_SHORT, fromLocalDate, MONTH_SHORT } from '../../domain/dates'
import { computeStreak } from '../../domain/streaks'
import type { Hobby, Log } from '../../domain/types'
import { useBlobUrl } from '../../ui/useBlobUrl'
import { removeLog } from './actions'
import { HeatGrid } from './HeatGrid'
import type { HobbyData } from './HobbyCard'

function fmtDate(d: string) {
  const x = fromLocalDate(d)
  return `${DAY_SHORT[x.getDay()]} ${MONTH_SHORT[x.getMonth()]} ${x.getDate()}`
}

function Photo({ id, alt }: { id: string; alt: string }) {
  const url = useBlobUrl(id)
  return url ? <img className="photo" src={url} alt={alt} /> : <div className="photo" aria-hidden="true" />
}

export function HobbyDetail({ hobby, data, onEdit, onCheckIn }: { hobby: Hobby; data: HobbyData; onEdit: (h: Hobby) => void; onCheckIn: (h: Hobby) => void }) {
  const { logs, pauses, today, weekStart } = data
  const mine = logs.filter((l) => l.hobbyId === hobby.id).sort((a, b) => (a.localDate === b.localDate ? b.at - a.at : a.localDate < b.localDate ? 1 : -1))
  const streak = computeStreak({ hobby, logs, pauses, today, weekStart })
  const stats = hobbyStats({ hobby, logs, pauses, today, weekStart })
  const photos = mine.filter((l) => l.photoId)
  const milestones = mine.filter((l) => l.milestone)

  return (
    <>
      <div className="pagehead">
        <p className="mono"><a href="#/life">Life</a> · {cadenceLabel(hobby.cadence)}</p>
        <h1>{hobby.name}</h1>
        <p>{weeklyReview(hobby.name, logs, hobby.id, today)}</p>
      </div>
      <div className="actions" style={{ marginBottom: 20 }}>
        <button className="btn" type="button" onClick={() => onCheckIn(hobby)}>Check in with details</button>
        <button className="btn ghost" type="button" onClick={() => onEdit(hobby)}>Edit</button>
      </div>

      <div className="bento">
        <section className="tile span-4" aria-label="Streak">
          <h2>Current streak</h2>
          <div className="wide stat">{streak.current}</div>
          <p className="sub">{streak.unit}{streak.current === 1 ? '' : 's'} · best {streak.best}</p>
        </section>
        <section className="tile span-8" aria-label="Stats">
          <h2>Stats</h2>
          <dl className="statgrid">
            <div><dt>Total time</dt><dd>{(stats.totalMinutes / 60).toFixed(1)} h</dd></div>
            <div><dt>Weekly average</dt><dd>{(stats.weeklyAvgMinutes / 60).toFixed(1)} h</dd></div>
            <div><dt>Best week</dt><dd>{stats.bestWeek ? `${(stats.bestWeek.minutes / 60).toFixed(1)} h` : '–'}</dd></div>
            <div><dt>Consistency</dt><dd>{stats.consistency === null ? '–' : `${stats.consistency}%`}</dd></div>
            <div><dt>Sessions</dt><dd>{stats.sessions}</dd></div>
            <div><dt>Mostly</dt><dd>{(Object.entries(stats.timeOfDay).sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0) > 0 ? Object.entries(stats.timeOfDay).sort((a, b) => b[1] - a[1])[0][0] : '–'}</dd></div>
          </dl>
        </section>
        <section className="tile span-12" aria-label="Heatmap">
          <h2>Last 26 weeks</h2>
          <HeatGrid cells={heatCells(mine, today, 26, weekStart)} today={today} label={`${hobby.name} last 26 weeks`} columns={26} />
          <p className="sub">Every good day stays on the map, even after a break.</p>
        </section>

        {milestones.length > 0 && (
          <section className="tile span-6" aria-label="Milestones">
            <h2>Milestones</h2>
            <ul className="list">
              {milestones.map((l) => <li key={l.id}><span className="title"><b>{l.note ?? 'Milestone'}</b></span><span className="sub">{fmtDate(l.localDate)}</span></li>)}
            </ul>
          </section>
        )}
        {photos.length > 0 && (
          <section className="tile span-6" aria-label="Progress photos">
            <h2>Progress photos</h2>
            <div className="photos">
              {[...photos].reverse().map((l) => <figure key={l.id}><Photo id={l.photoId!} alt={`${hobby.name} on ${l.localDate}`} /><figcaption className="sub">{fmtDate(l.localDate)}</figcaption></figure>)}
            </div>
          </section>
        )}

        <section className="tile span-12" aria-label="Journal">
          <h2>Journal</h2>
          {mine.length === 0 ? <p className="sub">Nothing yet. Check in to start your journal.</p> : (
            <ul className="list">
              {mine.slice(0, 40).map((l: Log) => (
                <li key={l.id}>
                  <span className="title">
                    <b>{l.note ?? (l.milestone ? 'Milestone' : 'Practice')}{l.milestone && <span className="badge" style={{ marginLeft: 8 }}>milestone</span>}</b>
                    <span className="sub">{fmtDate(l.localDate)}{l.durationMin ? ` · ${l.durationMin} min` : ''}{l.metric ? ` · ${l.metric.value} ${l.metric.label}` : ''}</span>
                  </span>
                  <button className="btn ghost" type="button" onClick={() => removeLog(l)} aria-label={`Delete entry from ${fmtDate(l.localDate)}`}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
