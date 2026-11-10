import { useState } from 'react'
import { getApiKey, getProvider } from '../../ai'
import type { ExtractedAssignment } from '../../ai/types'
import { repo } from '../../data'
import { officeText } from '../../domain/officeText'
import type { AssignmentType, Course } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'

const TYPES: AssignmentType[] = ['homework', 'quiz', 'exam', 'project', 'reading']

interface Row extends ExtractedAssignment { keep: boolean; courseId: string }

function toBase64(buf: ArrayBuffer): string {
  let s = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/** Paste a syllabus or pick a file; review what was found; nothing is saved until "Add". */
export function SyllabusImport({ open, onClose, courses, today, aiEnabled }: { open: boolean; onClose: () => void; courses: Course[]; today: string; aiEnabled: boolean }) {
  return <Modal open={open} onClose={onClose} title="Import from a syllabus">{open && <Body onClose={onClose} courses={courses} today={today} aiEnabled={aiEnabled} />}</Modal>
}

function Body({ onClose, courses, today, aiEnabled }: { onClose: () => void; courses: Course[]; today: string; aiEnabled: boolean }) {
  const useAi = aiEnabled && !!getApiKey()
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [defaultCourse, setDefaultCourse] = useState(courses[0]?.id ?? '')

  async function find() {
    setError(''); setBusy(true)
    try {
      let plain = text.trim() || undefined
      let pdfBase64: string | undefined
      if (file) {
        const name = file.name.toLowerCase()
        if (name.endsWith('.pdf')) {
          if (!useAi) throw new Error('Reading a PDF needs the AI option (Settings). Or open the PDF, copy its text and paste it here.')
          pdfBase64 = toBase64(await file.arrayBuffer())
        } else if (name.endsWith('.docx') || name.endsWith('.pptx')) {
          plain = officeText(new Uint8Array(await file.arrayBuffer()), name.endsWith('.docx') ? 'docx' : 'pptx')
        } else plain = await file.text()
      }
      if (!plain && !pdfBase64) throw new Error('Paste some text or choose a file first.')
      const found = await (await getProvider(aiEnabled)).extractAssignments({ text: plain, pdfBase64, today, courseNames: courses.map((c) => c.name) })
      setRows(found.map((f) => ({ ...f, keep: true, courseId: courses.find((c) => c.name.toLowerCase() === f.course?.toLowerCase())?.id ?? defaultCourse })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that.')
    }
    setBusy(false)
  }

  const patch = (i: number, p: Partial<Row>) => setRows(rows!.map((r, j) => (j === i ? { ...r, ...p } : r)))

  async function add() {
    const keep = (rows ?? []).filter((r) => r.keep && r.courseId)
    const ids: string[] = []
    for (const r of keep) {
      ids.push((await repo.assignments.put({ courseId: r.courseId, title: r.title, dueDate: r.dueDate, dueTime: r.dueTime, type: r.type, priority: r.type === 'exam' || r.type === 'quiz' ? 3 : 2, estimatedMinutes: r.estimatedMinutes, status: 'todo', subtasks: [], tags: ['syllabus'], attachmentIds: [] })).id)
    }
    showToast(`Added ${ids.length} ${ids.length === 1 ? 'assignment' : 'assignments'}.`, { actionLabel: 'Undo', onAction: () => void Promise.all(ids.map((id) => repo.assignments.remove(id))) })
    onClose()
  }

  if (courses.length === 0) return <p>Add your courses first so the assignments have somewhere to go.</p>

  if (rows) {
    return (
      <div className="form-grid">
        <p className="full sub">{rows.length === 0 ? 'Nothing with a date was found.' : `Found ${rows.length}. Check them, fix anything that is off, and untick what you do not want. Nothing is saved until you press Add.`}</p>
        <div className="full scroll-x">
          <table className="review">
            <thead><tr><th>Add</th><th>Title</th><th>Course</th><th>Due</th><th>Time</th><th>Type</th><th>Min</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input type="checkbox" checked={r.keep} aria-label={`Add ${r.title}`} onChange={(e) => patch(i, { keep: e.target.checked })} /></td>
                  <td><input value={r.title} aria-label="Title" onChange={(e) => patch(i, { title: e.target.value })} /></td>
                  <td><select value={r.courseId} aria-label="Course" onChange={(e) => patch(i, { courseId: e.target.value })}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                  <td><input type="date" value={r.dueDate} aria-label="Due date" onChange={(e) => patch(i, { dueDate: e.target.value })} /></td>
                  <td><input type="time" value={r.dueTime ?? ''} aria-label="Due time" onChange={(e) => patch(i, { dueTime: e.target.value || undefined })} /></td>
                  <td><select value={r.type} aria-label="Type" onChange={(e) => patch(i, { type: e.target.value as AssignmentType })}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></td>
                  <td><input type="number" min="0" value={r.estimatedMinutes ?? ''} aria-label="Minutes" onChange={(e) => patch(i, { estimatedMinutes: Number(e.target.value) || undefined })} style={{ width: 80 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions full">
          <button className="btn" type="button" disabled={!rows.some((r) => r.keep)} onClick={add}>Add {rows.filter((r) => r.keep).length}</button>
          <button className="btn ghost" type="button" onClick={() => setRows(null)}>Back</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-grid">
      <p className="full sub">{useAi
        ? 'AI is on: the text or file you choose, today’s date and your course names are sent to Anthropic with your key to find assignments. Nothing else leaves this device.'
        : 'AI is off, so this runs on your device and finds lines that contain a date. Turn on AI in Settings to read PDFs and messier syllabi.'}</p>
      <label className="field full">Paste syllabus text<textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Essay 1 due Nov 18\nQuiz 2: 11/20 at 2:10pm'} /></label>
      <label className="field">Or choose a file (.pdf, .docx, .pptx, .txt)<input type="file" accept=".pdf,.docx,.pptx,.txt,text/plain,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <label className="field">Course when unclear<select value={defaultCourse} onChange={(e) => setDefaultCourse(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {error && <p className="error full" role="alert">{error}</p>}
      <div className="actions full">
        <button className="btn" type="button" disabled={busy} onClick={find}>{busy ? 'Reading…' : 'Find assignments'}</button>
        <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
