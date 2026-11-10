import { useState } from 'react'
import { decodeFriendCode, encodeFriendCode, type FriendCard } from '../../domain/share'
import { showToast } from '../../ui/toast'

const FRIENDS = 'studyboard-friends'
const NAME = 'studyboard-my-name'
const load = <T,>(k: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? fallback } catch { return fallback } }
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } }

/** A private leaderboard: swap codes with friends by message. No server, nothing shared automatically. */
export function Friends({ level, xp, badges }: { level: number; xp: number; badges: number }) {
  const [name, setName] = useState<string>(() => load(NAME, 'Me'))
  const [friends, setFriends] = useState<FriendCard[]>(() => load(FRIENDS, []))
  const [code, setCode] = useState('')
  const mine = encodeFriendCode({ name, level, xp, badges })

  function add() {
    try {
      const f = decodeFriendCode(code)
      const next = [...friends.filter((x) => x.name !== f.name), f]
      setFriends(next); save(FRIENDS, next); setCode('')
      showToast(`Added ${f.name}.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'That code could not be read.')
    }
  }
  function remove(n: string) { const next = friends.filter((f) => f.name !== n); setFriends(next); save(FRIENDS, next) }
  async function copy() {
    try { await navigator.clipboard.writeText(mine); showToast('Your code is copied. Send it to a friend.') } catch { showToast('Select the code and copy it by hand.') }
  }

  const board = [...friends.map((f) => ({ ...f, me: false })), { name, level, xp, badges, me: true }].sort((a, b) => b.xp - a.xp)
  return (
    <section className="tile span-12" aria-label="Friends">
      <h2>Friends leaderboard</h2>
      <p className="sub">Codes are a snapshot of your level and XP. Swap them by message; nothing is shared automatically. Paste a newer code to update a friend.</p>
      <div className="inline">
        <label>Your name<input value={name} onChange={(e) => { setName(e.target.value); save(NAME, e.target.value) }} /></label>
        <label style={{ flex: 3 }}>Your code<input readOnly value={mine} onFocus={(e) => e.target.select()} /></label>
        <button className="btn ghost" type="button" onClick={copy}>Copy</button>
      </div>
      <div className="inline">
        <label style={{ flex: 3 }}>A friend’s code<input value={code} placeholder="SB1-..." onChange={(e) => setCode(e.target.value)} /></label>
        <button className="btn" type="button" disabled={!code.trim()} onClick={add}>Add</button>
      </div>
      <ol className="list">
        {board.map((f, i) => (
          <li key={f.name + i}>
            <span className="mono">{i + 1}</span>
            <span className="title"><b>{f.name}{f.me ? ' (you)' : ''}</b><span className="sub">Level {f.level} · {f.badges} badges</span></span>
            <span className="sub">{f.xp} XP</span>
            {!f.me && <button className="btn ghost" type="button" onClick={() => remove(f.name)}>Remove</button>}
          </li>
        ))}
      </ol>
    </section>
  )
}
