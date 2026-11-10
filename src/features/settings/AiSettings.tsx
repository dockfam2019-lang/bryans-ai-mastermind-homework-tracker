import { useState } from 'react'
import { getApiKey, setApiKey } from '../../ai'
import { CLAUDE_MODEL } from '../../ai/model'
import { repo } from '../../data'
import { IMPORTERS } from '../../domain/share'
import type { Settings } from '../../domain/types'
import { showToast } from '../../ui/toast'

/** Optional AI (off by default, your own key, stored only in this browser) and the tone setting. */
export function AiSettings({ settings }: { settings: Settings }) {
  const [key, setKey] = useState(getApiKey())
  const [saved, setSaved] = useState(!!getApiKey())

  const setAi = (aiEnabled: boolean) => repo.settings.put({ ...settings, aiEnabled })
  const setTone = (aiTone: Settings['aiTone']) => repo.settings.put({ ...settings, aiTone })

  return (
    <>
      <div className="field">
        <span className="mono" id="ai-label">AI help (optional)</span>
        <div className="seg" role="group" aria-labelledby="ai-label">
          <button type="button" aria-pressed={settings.aiEnabled} onClick={() => setAi(true)}>On</button>
          <button type="button" aria-pressed={!settings.aiEnabled} onClick={() => setAi(false)}>Off</button>
        </div>
        <p className="sub">When on, “Import syllabus” can read PDFs and messy syllabi, and assignments can suggest steps. It uses Claude ({CLAUDE_MODEL}) with your own Anthropic API key. Only what you choose to send goes to Anthropic: the syllabus or the one assignment, today’s date and your course names. Every result is a preview you can edit or throw away.</p>
        {settings.aiEnabled && (
          <>
            <label className="sr-only" htmlFor="ai-key">Anthropic API key</label>
            <div className="inline">
              <input id="ai-key" type="password" autoComplete="off" placeholder="sk-ant-..." value={key} onChange={(e) => { setKey(e.target.value); setSaved(false) }} />
              <button className="btn" type="button" onClick={() => { setApiKey(key); setSaved(!!key.trim()); showToast(key.trim() ? 'Key saved in this browser.' : 'Key removed.') }}>Save key</button>
              {saved && <button className="btn ghost" type="button" onClick={() => { setApiKey(''); setKey(''); setSaved(false); showToast('Key removed.') }}>Remove key</button>}
            </div>
            <p className="sub">{saved ? 'A key is saved.' : 'No key saved yet.'} It stays in this browser only, is never part of backups, and you can remove it any time. Anyone using this browser profile could use it, so do not save it on a shared computer.</p>
          </>
        )}
      </div>
      <div className="field">
        <span className="mono" id="tone-label">Tone of reminders and reviews</span>
        <div className="seg" role="group" aria-labelledby="tone-label">
          {(['gentle', 'balanced', 'strict'] as const).map((t) => <button key={t} type="button" aria-pressed={settings.aiTone === t} onClick={() => setTone(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>
      </div>
      <div className="field">
        <span className="mono">Coming later</span>
        <ul className="sub" style={{ margin: 0, paddingLeft: 18 }}>
          {IMPORTERS.filter((i) => !i.available).map((i) => <li key={i.id}>{i.name} import: {i.note}</li>)}
          <li>Sync across devices: needs a server. The merge rules are built and tested; the server is not.</li>
          <li>Study with friends (a shared live timer): needs a server. For now, share a class file or a friend code.</li>
        </ul>
      </div>
    </>
  )
}
