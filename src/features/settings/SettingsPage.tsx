import { useState } from 'react'
import { repo } from '../../data'
import { DEFAULT_SETTINGS, seedSample } from '../../data/seed'
import { toLocalDate } from '../../domain/dates'
import type { ThemeSetting } from '../../domain/types'
import { useLive } from '../../ui/hooks'

export function SettingsPage() {
  const settings = useLive(() => repo.settings.get('main'))
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!settings) return null

  const setTheme = (theme: ThemeSetting) => repo.settings.put({ ...settings, theme })
  const setWeekStart = (weekStart: 0 | 1) => repo.settings.put({ ...settings, weekStart })

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
          <p className="sub">Export and import arrive in Phase 5.</p>
        </div>
      </div>
    </>
  )
}
