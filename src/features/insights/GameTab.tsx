import { computeBadges, computeXp, levelFor, weeklyQuests, type GameInput } from '../../domain/game'
import { Friends } from './Friends'

/** Opt-in game layer. Everything here is derived from your records, so nothing is ever taken away. */
export function GameTab({ game }: { game: GameInput }) {
  const xp = computeXp(game)
  const lv = levelFor(xp)
  const badges = computeBadges(game)
  const quests = weeklyQuests(game)
  return (
    <div className="bento">
      <section className="tile glass span-6" aria-label="Level">
        <h2>Level</h2>
        <div className="wide stat">{lv.level}</div>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(lv.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level"><i style={{ width: `${lv.progress * 100}%` }} /></div>
        <p className="sub">{xp} XP · {lv.next - xp} to level {lv.level + 1}</p>
        <p className="sub">XP comes from finishing work (most for finishing early), focus time and hobby check-ins. A missed day never costs anything.</p>
      </section>

      <section className="tile span-6" aria-label="Weekly quests">
        <h2>This week’s quests</h2>
        <ul className="list">
          {quests.map((q) => (
            <li key={q.id}>
              <span className="title"><b>{q.title}</b><span className="bar" style={{ marginTop: 6, display: 'block' }}><i style={{ width: `${(q.progress / q.target) * 100}%` }} /></span></span>
              <span className="sub">{q.done ? 'Done' : `${q.progress} of ${q.target}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="tile span-12" aria-label="Badges">
        <h2>Badges · {badges.filter((b) => b.earned).length} of {badges.length}</h2>
        <div className="badges">
          {badges.map((b) => (
            <div key={b.id} className={`badge-card${b.earned ? ' earned' : ''}`}>
              <b>{b.title}</b>
              <span className="sub">{b.description}</span>
              <span className="mono">{b.earned ? 'Earned' : `${b.progress} of ${b.target}`}</span>
            </div>
          ))}
        </div>
      </section>

      <Friends level={lv.level} xp={xp} badges={badges.filter((b) => b.earned).length} />
    </div>
  )
}
