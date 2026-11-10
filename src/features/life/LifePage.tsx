import { useState } from 'react'
import { repo } from '../../data'
import { toLocalDate } from '../../domain/dates'
import { heatCells, weeklyReview } from '../../domain/hobbies'
import type { Hobby } from '../../domain/types'
import { useLive, useNow } from '../../ui/hooks'
import { pauseAll, resumeAll } from './actions'
import { CheckInDialog } from './CheckInDialog'
import { HeatGrid } from './HeatGrid'
import { HobbyCard, type HobbyData } from './HobbyCard'
import { HobbyDetail } from './HobbyDetail'
import { HobbyForm } from './HobbyForm'

export function LifePage({ sub }: { sub: string }) {
  const now = useNow()
  const today = toLocalDate(now)
  const hobbies = useLive(() => repo.hobbies.all())
  const logs = useLive(() => repo.logs.all())
  const pauses = useLive(() => repo.pauses.all())
  const settings = useLive(() => repo.settings.get('main'))
  const [editing, setEditing] = useState<Partial<Hobby> | null>(null)
  const [checking, setChecking] = useState<Hobby | null>(null)

  if (!hobbies || !logs || !pauses || !settings) return null
  const data: HobbyData = { logs, pauses, today, weekStart: settings.weekStart }
  const active = hobbies.filter((h) => !h.archived)
  const openPause = pauses.find((p) => p.hobbyId === '*' && p.kind === 'pause' && (p.end === undefined || p.end >= today))
  const detail = sub ? hobbies.find((h) => h.id === sub) : undefined

  const dialogs = (
    <>
      <HobbyForm hobby={editing} onClose={() => setEditing(null)} />
      <CheckInDialog hobby={checking} onClose={() => setChecking(null)} />
    </>
  )

  if (sub) {
    return detail ? (
      <>
        <HobbyDetail hobby={detail} data={data} onEdit={(h) => setEditing(h)} onCheckIn={(h) => setChecking(h)} />
        {dialogs}
      </>
    ) : (
      <div className="empty"><p>That hobby is not here anymore.</p><a className="btn ghost" href="#/life" style={{ textDecoration: 'none' }}>Back to Life</a></div>
    )
  }

  return (
    <>
      <div className="pagehead">
        <p className="mono">{`${active.length} ${active.length === 1 ? 'hobby' : 'hobbies'}`}</p>
        <h1>Life</h1>
        <p>{active.length > 0 ? weeklyReview(active[0].name, logs, active[0].id, today) : 'The things you do for you. A missed day is just data.'}</p>
      </div>

      <div className="actions" style={{ marginBottom: 20 }}>
        <button className="btn" type="button" onClick={() => setEditing({})}>Add hobby</button>
        {openPause ? (
          <button className="btn ghost" type="button" onClick={() => resumeAll(openPause, today)}>Resume from vacation</button>
        ) : (
          active.length > 0 && <button className="btn ghost" type="button" onClick={() => pauseAll(today)}>Pause everything (vacation)</button>
        )}
      </div>
      {openPause && <p className="sub" style={{ marginBottom: 16 }}>Paused since {openPause.start}. Nothing counts against you right now.</p>}

      {active.length === 0 ? (
        <div className="empty">
          <p>No hobbies yet.</p>
          <p className="sub">Add guitar, drawing, running, reading or a side project. Pick how often, and check in with one tap.</p>
        </div>
      ) : (
        <div className="bento">
          <section className="tile span-12" aria-label="Year view">
            <h2>All hobbies, past year</h2>
            <HeatGrid cells={heatCells(logs.filter((l) => active.some((h) => h.id === l.hobbyId)), today, 53, settings.weekStart)} today={today} label="All hobbies over the past year" columns={53} />
          </section>
          {active.map((h) => (
            <HobbyCard key={h.id} hobby={h} data={data} onDetails={(x) => setChecking(x)} />
          ))}
        </div>
      )}
      {dialogs}
    </>
  )
}
