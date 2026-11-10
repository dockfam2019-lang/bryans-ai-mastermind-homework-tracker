import { useState } from 'react'
import { repo } from '../../data'
import { DEFAULT_SETTINGS, seedSample } from '../../data/seed'
import { toLocalDate } from '../../domain/dates'
import type { ThemeSetting } from '../../domain/types'
import { useLive } from '../../ui/hooks'
import { DataTools } from './DataTools'

export function SettingsPage() {
  const settings = useLive(() => repo.settings.get('main'))
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [, setPermissionTick] = useState(0)

  if (!settings) return null

  const setTheme = (theme: ThemeSetting) => repo.settings.put({ ...settings, theme })
  const setWeekStart = (weekStart: 0 | 1) => repo.settings.put({ ...settings, weekStart })
  const setReminders = (notifications: boolean) => repo.settings.put({ ...settings, notifications })
  const setGame = (gameEnabled: boolean) => repo.settings.put({ ...settings, gameEnabled })
  const setRotation = (rotationStart: string) => repo.settings.put({ ...settings, rotationStart: rotationStart || undefined })
  const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  async function askPermission() {
    if (typeof Notification === 'undefined') return
    await Notification.requestPermission()
    setPermissionTick((n) => n + 1)
  }

  async function loadSample() {
    setBusy(true)
    await repo.clearAll()
    await seedSample(repo, toLocalDate(new Date()))
    setBusy(false)
  }
  async function clearAll() {
    setBusy(true)
    await repo.clearAll()
    await repo.settings.put({ ...DEFAULT_SETTINGS, seeded: true })
    setBusy(false)
    setConfirming(false)
  }

  return (
    <>
      <div className="pagehead">
        <p className="mono">On this device only</p>
        <h1>Settings</h1>
        <p>Everything you add is stored in this browser. Nothing is sent anywhere.</p>
      </div>
      <div className="form">
        <div className="field">
          <span className="mono" id="theme-label">Theme</span>
          <div className="seg" role="group" aria-labelledby="theme-label">
            {(['dark', 'light', 'system'] as ThemeSetting[]).map((t) => (
              <button key={t} type="button" aria-pressed={settings.theme === t} onClick={() => setTheme(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="mono" id="week-label">Week starts on</span>
          <div className="seg" role="group" aria-labelledby="week-label">
            <button type="button" aria-pressed={settings.weekStart === 0} onClick={() => setWeekStart(0)}>Sunday</button>
            <button type="button" aria-pressed={settings.weekStart === 1} onClick={() => setWeekStart(1)}>Monday</button>
          </div>
        </div>
        <div className="field">
          <span className="mono" id="rem-label">Reminders</span>
          <div className="seg" role="group" aria-labelledby="rem-label">
            <button type="button" aria-pressed={settings.notifications} onClick={() => setReminders(true)}>On</button>
            <button type="button" aria-pressed={!settings.notifications} onClick={() => setReminders(false)}>Off</button>
          </div>
          <p className="sub">An hour before things are due, ten minutes before class, and an evening note about tomorrow. They appear inside the app while it is open.</p>
          {permission === 'default' && <button className="btn ghost" type="button" onClick={askPermission}>Also use system notifications</button>}
          {permission === 'granted' && <p className="sub">System notifications are on. Some browsers, such as Safari on iPhone, only deliver them when the app is open.</p>}
          {permission === 'denied' && <p className="sub">System notifications are blocked in your browser settings. In-app reminders still work.</p>}
        </div>
        <div className="field">
          <span className="mono" id="game-label">Game layer (XP, levels, badges, quests)</span>
          <div className="seg" role="group" aria-labelledby="game-label">
            <button type="button" aria-pressed={settings.gameEnabled} onClick={() => setGame(true)}>On</button>
            <button type="button" aria-pressed={!settings.gameEnabled} onClick={() => setGame(false)}>Off</button>
          </div>
          <p className="sub">Optional and never punishing: no XP is lost for a missed day, and nothing nags you.</p>
        </div>
        <div className="field">
          <label htmlFor="rotation" className="mono">First A day (for A/B rotating classes)</label>
          <input id="rotation" type="date" value={settings.rotationStart ?? ''} onChange={(e) => setRotation(e.target.value)} />
        </div>
        <DataTools />
        <div className="field">
          <span className="mono">Data</span>
          <button className="btn ghost" type="button" disabled={busy} onClick={loadSample}>Reload sample data</button>
          {confirming ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn danger" type="button" disabled={busy} onClick={clearAll}>Yes, delete everything</button>
              <button className="btn ghost" type="button" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn danger" type="button" onClick={() => setConfirming(true)}>Delete all data</button>
          )}
        </div>
      </div>
    </>
  )
}
