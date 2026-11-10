import { useState } from 'react'
import { repo } from '../../data'
import { balanceByDay, balanceNudge } from '../../domain/balance'
import { addDays, DAY_SHORT, startOfWeek, toLocalDate } from '../../domain/dates'
import { rankByHardness } from '../../domain/difficulty'
import { learnWindows } from '../../domain/energy'
import { weeklyReview } from '../../domain/hobbies'
import { withTone } from '../../domain/tone'
import { loadByDay, peakDay } from '../../domain/load'
import { semesterRecap } from '../../domain/recap'
import { capacityFor, DEFAULT_STUDY_MINUTES } from '../../domain/scheduler'
import { burnoutHint, moodTrend, WELLBEING_NOTE } from '../../domain/wellbeing'
import { showToast } from '../../ui/toast'
import { PulseChart } from '../today/PulseChart'
import { GameTab } from './GameTab'
import { downloadBlob, renderRecapPng } from './recapImage'
import { useInsightsData, type InsightsData } from './useInsightsData'

const MOODS: [1 | 2 | 3 | 4 | 5, string][] = [[1, 'Rough'], [2, 'Low'], [3, 'Okay'], [4, 'Good'], [5, 'Great']]
const hm = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`

export function InsightsPage({ tab }: { tab: string }) {
  const d = useInsightsData()
  if (!d) return null
  const showGame = d.settings.gameEnabled
  return (
    <>
      <div className="pagehead">
        <p className="mono">Where your time goes</p>
        <h1>Insights</h1>
      </div>
      <nav className="tabs" aria-label="Insights sections">
        <a href="#/insights" aria-current={tab === '' ? 'page' : undefined}>Overview</a>
        {showGame && <a href="#/insights/game" aria-current={tab === 'game' ? 'page' : undefined}>Game</a>}
      </nav>
      {tab === 'game' && showGame ? <GameTab game={d.game} /> : <Overview d={d} />}
    </>
  )
}

function Overview({ d }: { d: InsightsData }) {
  const perDay = d.settings.studyMinutesPerDay ?? DEFAULT_STUDY_MINUTES
  const open = d.assignments.filter((a) => a.status !== 'done')
  const load30 = loadByDay(d.assignments, d.today, 30)
  const load56 = loadByDay(d.assignments, startOfWeek(d.today, d.settings.weekStart), 42)
  const days = balanceByDay(d.focusSessions, d.logs, d.today)
  const dueSoon = open.filter((a) => a.dueDate <= addDays(d.today, 3)).length
  const nudge = balanceNudge(days, dueSoon)
  const hint = burnoutHint({ moods: d.moods, load: load30, capacity: (x) => capacityFor(x, perDay), recent: days, today: d.today })
  const weekStart = startOfWeek(d.today, d.settings.weekStart)
  const doneThisWeek = d.assignments.filter((a) => a.completedAt && toLocalDate(new Date(a.completedAt)) >= weekStart).length
  const focusThisWeek = d.focusSessions.filter((f) => f.localDate >= weekStart).reduce((s, f) => s + f.minutes, 0)
  const maxDay = Math.max(60, ...days.map((x) => x.schoolMin + x.hobbyMin))

  async function recap() {
    const blob = await renderRecapPng(semesterRecap(d.game, d.hobbies))
    downloadBlob(blob, 'studyboard-recap.png')
    showToast('Recap image saved to your downloads.')
  }

  return (
    <div className="bento">
      <section className="tile span-12" aria-label="Weekly review">
        <h2>Weekly review</h2>
        <p>{withTone('review', d.settings.aiTone, `This week you finished ${doneThisWeek} ${doneThisWeek === 1 ? 'assignment' : 'assignments'} and focused for ${hm(focusThisWeek)}.`)}</p>
        {d.hobbies.map((h) => <p key={h.id} className="sub">{weeklyReview(h.name, d.logs, h.id, d.today)}</p>)}
      </section>

      {hint && <section className="warn span-12" role="status" aria-label="A gentle check-in"><b>A gentle check-in.</b> {hint.message}</section>}

      <section className="tile span-12" aria-label="Workload">
        <h2>Workload, next 30 days</h2>
        <div className="wide stat">{hm(load30.reduce((s, x) => s + x.minutes, 0))}</div>
        <PulseChart load={load30} today={d.today} peak={peakDay(load30)} />
        <h2 style={{ marginTop: 8 }}>Heatmap, next 6 weeks</h2>
        <div className="heat" style={{ gridTemplateColumns: 'repeat(6, 1fr)', maxWidth: 360 }} role="img" aria-label="Workload heatmap for the next six weeks">
          {load56.map((x) => {
            const ratio = x.minutes / capacityFor(x.date, perDay)
            const level = x.minutes === 0 ? 0 : ratio < 0.4 ? 1 : ratio < 0.8 ? 2 : ratio <= 1.1 ? 3 : 4
            return <i key={x.date} className={`l${level}`} style={x.date < d.today ? { opacity: 0.3 } : undefined} title={`${x.date}: ${x.minutes} min of ${capacityFor(x.date, perDay)}`} />
          })}
        </div>
        <p className="sub">Darker means a heavier day compared with the time you set aside. Dark days are the ones to start early for.</p>
      </section>

      <section className="tile span-6" aria-label="School and hobby balance">
        <h2>Balance, last 7 days</h2>
        <div className="stackbars" role="img" aria-label="School and hobby minutes for each of the last 7 days">
          {days.map((x) => (
            <div key={x.date} className="stackbar" title={`${x.date}: school ${x.schoolMin} min, hobbies ${x.hobbyMin} min`}>
              <div className="stack">
                <i className="h" style={{ height: `${(x.hobbyMin / maxDay) * 100}%` }} />
                <i className="s" style={{ height: `${(x.schoolMin / maxDay) * 100}%` }} />
              </div>
              <span className="mono">{DAY_SHORT[new Date(x.date + 'T00:00:00').getDay()][0]}</span>
            </div>
          ))}
        </div>
        <p className="sub"><i className="dot" style={{ background: 'var(--accent-2)' }} />School {hm(days.reduce((s, x) => s + x.schoolMin, 0))} · <i className="dot" style={{ background: 'var(--accent)' }} />Hobbies {hm(days.reduce((s, x) => s + x.hobbyMin, 0))}</p>
        <p>{nudge.message}</p>
      </section>

      <MoodSection d={d} />
      <EnergySection d={d} />
      <HardestSection d={d} />

      <section className="tile span-12" aria-label="Semester recap">
        <h2>Semester recap</h2>
        <p className="sub">Makes a picture of your term to save or share. Nothing is uploaded.</p>
        <button className="btn" type="button" onClick={recap}>Create recap image</button>
      </section>
    </div>
  )
}

function MoodSection({ d }: { d: InsightsData }) {
  const todayMood = d.moods.find((m) => m.localDate === d.today)
  const trend = moodTrend(d.moods, d.today, 14)
  const [note, setNote] = useState(todayMood?.note ?? '')

  async function pick(mood: 1 | 2 | 3 | 4 | 5) {
    await repo.moods.put({ ...(todayMood ?? {}), localDate: d.today, mood, note: note.trim() || undefined })
  }
  return (
    <section className="tile span-6" aria-label="Mood check-in">
      <h2>How are you today?</h2>
      <div className="respond" role="group" aria-label="Mood">
        {MOODS.map(([n, label]) => <button key={n} type="button" aria-pressed={todayMood?.mood === n} onClick={() => pick(n)}>{label}</button>)}
      </div>
      <label className="sr-only" htmlFor="mood-note">Mood note</label>
      <input id="mood-note" value={note} placeholder="Anything to remember about today? (optional)" onChange={(e) => setNote(e.target.value)} onBlur={() => { if (todayMood) void pick(todayMood.mood) }} />
      <div className="moodtrail" role="img" aria-label="Mood over the last 14 days">
        {trend.map((m, i) => <i key={i} style={{ height: m === null ? 4 : 8 + m * 8, opacity: m === null ? 0.25 : 1 }} />)}
      </div>
      <p className="sub">{WELLBEING_NOTE}</p>
    </section>
  )
}

function EnergySection({ d }: { d: InsightsData }) {
  const learned = learnWindows(d.focusSessions)
  const max = learned ? Math.max(1, ...learned.byHour) : 1
  const label = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`

  async function useLearned() {
    if (!learned) return
    for (const w of d.windows) await repo.energyWindows.remove(w.id)
    for (const w of learned.suggested) await repo.energyWindows.put(w)
    showToast('Energy windows updated from your focus sessions.')
  }
  async function addWindow() { await repo.energyWindows.put({ startHour: 16, endHour: 18, rating: 'best' }) }
  const update = (id: string, patch: Partial<{ startHour: number; endHour: number; rating: 'best' | 'ok' | 'worst' }>) => {
    const w = d.windows.find((x) => x.id === id)
    if (w) void repo.energyWindows.put({ ...w, ...patch })
  }

  return (
    <section className="tile span-6" aria-label="Energy and focus times">
      <h2>When you focus best</h2>
      {learned ? (
        <div className="hourbars" role="img" aria-label="Focus minutes by hour of day">
          {learned.byHour.slice(6, 23).map((m, i) => <div key={i} title={`${label(i + 6)}: ${m} min`}><i style={{ height: `${(m / max) * 100}%` }} /><span className="mono">{(i + 6) % 3 === 0 ? label(i + 6) : ''}</span></div>)}
        </div>
      ) : <p className="sub">Complete five focus sessions and this shows the hours you do your best work.</p>}
      {learned && <button className="btn ghost" type="button" onClick={useLearned}>Use these as my energy windows</button>}

      <h2 style={{ marginTop: 8 }}>My energy windows</h2>
      <p className="sub">Hard work goes in your best windows, light work in your worst. Used by “Place blocks in my best times” in Week, Plan.</p>
      {d.windows.map((w) => (
        <div key={w.id} className="inline">
          <label>From<input type="number" min="0" max="23" value={w.startHour} onChange={(e) => update(w.id, { startHour: Number(e.target.value) })} /></label>
          <label>To<input type="number" min="1" max="24" value={w.endHour} onChange={(e) => update(w.id, { endHour: Number(e.target.value) })} /></label>
          <label>Energy<select value={w.rating} onChange={(e) => update(w.id, { rating: e.target.value as 'best' | 'ok' | 'worst' })}><option value="best">Best</option><option value="ok">Okay</option><option value="worst">Low</option></select></label>
          <button className="btn ghost" type="button" onClick={() => void repo.energyWindows.remove(w.id)}>Remove</button>
        </div>
      ))}
      <button className="btn ghost" type="button" onClick={addWindow}>Add a window</button>
    </section>
  )
}

function HardestSection({ d }: { d: InsightsData }) {
  const open = d.assignments.filter((a) => a.status !== 'done')
  const history = d.assignments.filter((a) => a.status === 'done')
  const ranked = rankByHardness(open, history).slice(0, 5)
  return (
    <section className="tile span-6" aria-label="Likely hardest assignments">
      <h2>Likely hardest next</h2>
      {ranked.length === 0 ? <p className="sub">Nothing open.</p> : (
        <ul className="list">
          {ranked.map(({ assignment: a, prediction: p }) => (
            <li key={a.id}>
              <span className="title"><b>{a.title}</b><span className="sub">{p.reasons.join('; ')}</span><span className="bar" style={{ marginTop: 6, display: 'block' }}><i style={{ width: `${(p.score / 5) * 100}%` }} /></span></span>
              <label className="sr-only" htmlFor={`rate-${a.id}`}>Rate difficulty of {a.title}</label>
              <select id={`rate-${a.id}`} style={{ width: 'auto' }} value={a.difficulty ?? ''} onChange={(e) => void repo.assignments.put({ ...a, difficulty: e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4 | 5) : undefined })}>
                <option value="">{p.score.toFixed(1)} est.</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} of 5</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
      <p className="sub">Predictions come from the type of work, its length and what you have finished before. Rate an item to teach it.</p>
    </section>
  )
}
