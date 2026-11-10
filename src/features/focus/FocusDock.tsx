import { useEffect, useState } from 'react'
import { formatClock, remainingMs } from '../../domain/pomodoro'
import { finishEarly, keepGoing, pauseFocus, resumeFocus, skipBreak, startNext, stopFocus, tickFocus, useFocus } from './focusStore'

const LABEL = { focus: 'Focus', short: 'Short break', long: 'Long break' } as const

/** Floating timer, visible on every page while a session is open. */
export function FocusDock() {
  const f = useFocus()
  const [, force] = useState(0)

  useEffect(() => {
    if (f.mode === 'idle') return
    const id = setInterval(() => { tickFocus(); force((n) => n + 1) }, 500)
    return () => clearInterval(id)
  }, [f.mode])

  if (f.mode === 'idle') return null
  const left = f.mode === 'running' ? remainingMs(f.endAt, Date.now()) : f.mode === 'paused' ? f.pausedRemainingMs : 0

  return (
    <aside className="dock glass" aria-label="Focus timer">
      <p className="mono">{f.mode === 'awaiting' ? (f.next === 'focus' ? 'Break over' : 'Focus done') : LABEL[f.phase]}{f.mode === 'paused' ? ' · paused' : ''}</p>
      {f.mode !== 'awaiting' && <div className="wide clock" role="timer" aria-label={`${formatClock(left)} remaining`}>{formatClock(left)}</div>}
      <p className="sub">{f.target?.title ?? 'Focus'}</p>
      <div className="actions">
        {f.mode === 'running' && <button className="btn" type="button" onClick={pauseFocus}>Pause</button>}
        {f.mode === 'paused' && <button className="btn" type="button" onClick={resumeFocus}>Resume</button>}
        {(f.mode === 'running' || f.mode === 'paused') && f.phase === 'focus' && <button className="btn ghost" type="button" onClick={finishEarly}>Finish</button>}
        {(f.mode === 'running' || f.mode === 'paused') && f.phase !== 'focus' && <button className="btn ghost" type="button" onClick={skipBreak}>Skip break</button>}
        {f.mode === 'awaiting' && f.quick && <button className="btn" type="button" onClick={keepGoing}>Keep going</button>}
        {f.mode === 'awaiting' && <button className={f.quick ? 'btn ghost' : 'btn'} type="button" onClick={startNext}>{f.next === 'focus' ? 'Next focus' : `Start ${LABEL[f.next].toLowerCase()}`}</button>}
        <button className="btn ghost" type="button" onClick={stopFocus}>Close</button>
      </div>
    </aside>
  )
}
