import { useRef, useState } from 'react'
import { repo } from '../../data'
import type { Snapshot } from '../../data/repository'
import { assignmentsFromCsv, type CsvResult } from '../../domain/csv'
import { toLocalDate } from '../../domain/dates'
import { parseIcs, toIcs } from '../../domain/ics'
import type { Assignment } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'
import { downloadBlob } from '../insights/recapImage'

type NewAssignment = Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>

async function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Could not read that file'))
    r.readAsText(file)
  })
}

const stamp = () => toLocalDate(new Date())

/** Backups, calendar files and CSV. Replacing data always offers Undo. */
export function DataTools() {
  const [pendingBackup, setPendingBackup] = useState<Snapshot | null>(null)
  const [csv, setCsv] = useState<CsvResult | null>(null)
  const jsonInput = useRef<HTMLInputElement>(null)
  const icsInput = useRef<HTMLInputElement>(null)
  const csvInput = useRef<HTMLInputElement>(null)

  async function exportJson() {
    const snap = await repo.exportAll()
    downloadBlob(new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' }), `studyboard-backup-${stamp()}.json`)
    showToast('Backup saved to your downloads. Photos are not included.')
  }

  async function pickJson(file?: File) {
    if (!file) return
    try {
      const snap = JSON.parse(await readText(file)) as Snapshot
      if (snap.version !== 1 || typeof snap.tables !== 'object' || snap.tables === null) throw new Error('This is not a Studyboard backup.')
      setPendingBackup(snap)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not read that backup.')
    }
    if (jsonInput.current) jsonInput.current.value = ''
  }

  async function confirmImport() {
    if (!pendingBackup) return
    const before = await repo.exportAll()
    try {
      await repo.importAll(pendingBackup)
      showToast('Backup restored.', { actionLabel: 'Undo', onAction: () => void repo.importAll(before), ms: 15000 })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not restore that backup. Nothing was changed.')
    }
    setPendingBackup(null)
  }

  async function exportIcs() {
    const [assignments, courses] = await Promise.all([repo.assignments.all(), repo.courses.all()])
    downloadBlob(new Blob([toIcs(assignments, courses)], { type: 'text/calendar' }), `studyboard-${stamp()}.ics`)
    showToast('Calendar file saved. Import it into Apple, Google or Outlook Calendar.')
  }

  async function pickIcs(file?: File) {
    if (!file) return
    const [courses, events] = [await repo.courses.all(), parseIcs(await readText(file))]
    if (courses.length === 0) { showToast('Add a course first so imported events have somewhere to go.'); return }
    const made: string[] = []
    for (const e of events) {
      const m = e.summary.match(/^(.+?):\s+(.+)$/)
      const course = (m && courses.find((c) => c.name.toLowerCase() === m[1].trim().toLowerCase())) ?? courses[0]
      const item: NewAssignment = {
        courseId: course.id, title: m && course.name.toLowerCase() === m[1].trim().toLowerCase() ? m[2] : e.summary, dueDate: e.date, dueTime: e.time, type: 'homework', priority: 2,
        notes: e.description, status: 'todo', subtasks: [], tags: [], attachmentIds: [],
      }
      made.push((await repo.assignments.put(item)).id)
    }
    showToast(`Imported ${made.length} ${made.length === 1 ? 'event' : 'events'}.`, { actionLabel: 'Undo', onAction: () => void Promise.all(made.map((id) => repo.assignments.remove(id))) })
    if (icsInput.current) icsInput.current.value = ''
  }

  async function pickCsv(file?: File) {
    if (!file) return
    setCsv(assignmentsFromCsv(await readText(file), await repo.courses.all(), stamp()))
    if (csvInput.current) csvInput.current.value = ''
  }

  async function confirmCsv() {
    if (!csv) return
    const made: string[] = []
    for (const item of csv.items) made.push((await repo.assignments.put(item)).id)
    showToast(`Imported ${made.length} ${made.length === 1 ? 'assignment' : 'assignments'}.`, { actionLabel: 'Undo', onAction: () => void Promise.all(made.map((id) => repo.assignments.remove(id))) })
    setCsv(null)
  }

  return (
    <div className="field">
      <span className="mono">Backup and calendar</span>
      <div className="actions">
        <button className="btn ghost" type="button" onClick={exportJson}>Export backup (JSON)</button>
        <button className="btn ghost" type="button" onClick={() => jsonInput.current?.click()}>Import backup</button>
        <button className="btn ghost" type="button" onClick={exportIcs}>Export calendar (.ics)</button>
        <button className="btn ghost" type="button" onClick={() => icsInput.current?.click()}>Import calendar (.ics)</button>
        <button className="btn ghost" type="button" onClick={() => csvInput.current?.click()}>Import assignments (CSV)</button>
      </div>
      <input ref={jsonInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a backup file" onChange={(e) => void pickJson(e.target.files?.[0])} />
      <input ref={icsInput} type="file" accept="text/calendar,.ics" className="sr-only" aria-label="Choose a calendar file" onChange={(e) => void pickIcs(e.target.files?.[0])} />
      <input ref={csvInput} type="file" accept="text/csv,.csv" className="sr-only" aria-label="Choose a CSV file" onChange={(e) => void pickCsv(e.target.files?.[0])} />
      <p className="sub">CSV columns: title, course, due (like 11/18 or 2026-11-18), and optionally time, type and minutes. A school system importer can plug in here later.</p>

      <Modal open={pendingBackup !== null} onClose={() => setPendingBackup(null)} title="Restore this backup?">
        {pendingBackup && (
          <div className="form-grid">
            <p className="full">This replaces everything on this device with the backup from {new Date(pendingBackup.exportedAt).toLocaleString()}: {Object.values(pendingBackup.tables).reduce((n, t) => n + (Array.isArray(t) ? t.length : 0), 0)} records. You can undo it right afterwards.</p>
            <div className="actions full">
              <button className="btn danger" type="button" onClick={confirmImport}>Replace my data</button>
              <button className="btn ghost" type="button" onClick={() => setPendingBackup(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={csv !== null} onClose={() => setCsv(null)} title="Import assignments">
        {csv && (
          <div className="form-grid">
            <p className="full">{csv.items.length} ready to import{csv.skipped.length > 0 ? `, ${csv.skipped.length} skipped.` : '.'}</p>
            {csv.skipped.length > 0 && <ul className="full sub">{csv.skipped.slice(0, 8).map((s) => <li key={s.line}>Line {s.line}: {s.reason}</li>)}</ul>}
            <div className="actions full">
              <button className="btn" type="button" disabled={csv.items.length === 0} onClick={confirmCsv}>Import {csv.items.length}</button>
              <button className="btn ghost" type="button" onClick={() => setCsv(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
