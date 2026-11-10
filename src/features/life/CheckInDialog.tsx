import { useState, type FormEvent } from 'react'
import type { Hobby } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { checkIn, saveBlob } from './actions'

/** Check in with details: how long, a note, an optional measurement, a photo, and a milestone flag. */
export function CheckInDialog({ hobby, onClose }: { hobby: Hobby | null; onClose: () => void }) {
  return (
    <Modal open={hobby !== null} onClose={onClose} title={hobby ? `Check in: ${hobby.name}` : 'Check in'}>
      {hobby && <Body hobby={hobby} onClose={onClose} />}
    </Modal>
  )
}

function Body({ hobby, onClose }: { hobby: Hobby; onClose: () => void }) {
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')
  const [metricLabel, setMetricLabel] = useState('')
  const [metricValue, setMetricValue] = useState('')
  const [milestone, setMilestone] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const photoId = file ? await saveBlob(file) : undefined
    await checkIn(hobby, {
      durationMin: duration ? Math.max(1, Number(duration)) : undefined,
      note: note.trim() || undefined,
      photoId,
      metric: metricLabel.trim() && metricValue ? { label: metricLabel.trim(), value: Number(metricValue) } : undefined,
      milestone: milestone || undefined,
    })
    onClose()
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field">Minutes<input autoFocus type="number" min="1" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} /></label>
      <label className="field">Photo (optional)<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <label className="field full">Note<textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you work on?" /></label>
      <label className="field">Measure (optional)<input value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} placeholder="pages, km, songs" /></label>
      <label className="field">Amount<input type="number" step="any" value={metricValue} onChange={(e) => setMetricValue(e.target.value)} /></label>
      <label className="inline full"><input type="checkbox" checked={milestone} onChange={(e) => setMilestone(e.target.checked)} /> This is a milestone</label>
      <div className="actions full">
        <button className="btn" type="submit" disabled={busy}>Check in</button>
        <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}
