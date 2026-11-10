import { useEffect, useState } from 'react'
import { repo } from '../../data'
import { toLocalDate } from '../../domain/dates'
import type { Assignment, InboxItem } from '../../domain/types'
import { useLive, useNow } from '../../ui/hooks'
import { AssignmentForm, type AssignmentDraft } from './AssignmentForm'
import { AssignmentList } from './AssignmentList'
import { AttendancePanel } from './AttendancePanel'
import { GradesPanel } from './GradesPanel'
import { ReadingPanel } from './ReadingPanel'
import { CoursesPanel } from './CoursesPanel'
import { InboxPanel } from './InboxPanel'
import { QuickAdd } from './QuickAdd'
import { SetupWizard } from './SetupWizard'

const TABS = [
  { id: '', label: 'Assignments' },
  { id: 'courses', label: 'Courses' },
  { id: 'grades', label: 'Grades' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'reading', label: 'Reading' },
  { id: 'inbox', label: 'Inbox' },
]

export function SchoolPage({ tab }: { tab: string }) {
  const now = useNow()
  const today = toLocalDate(now)
  const assignments = useLive(() => repo.assignments.all())
  const courses = useLive(() => repo.courses.all())
  const inbox = useLive(() => repo.inbox.all())
  const scales = useLive(() => repo.gradingScales.all())
  const attendance = useLive(() => repo.attendance.all())
  const notes = useLive(() => repo.classNotes.all())
  const reading = useLive(() => repo.readingItems.all())
  const settings = useLive(() => repo.settings.get('main'))
  const [draft, setDraft] = useState<AssignmentDraft | null>(null)
  const [fromInbox, setFromInbox] = useState<InboxItem | null>(null)
  const [wizard, setWizard] = useState(false)

  // "n" anywhere opens a new assignment
  useEffect(() => {
    const open = () => setDraft({ title: '' })
    window.addEventListener('studyboard:new-assignment', open)
    return () => window.removeEventListener('studyboard:new-assignment', open)
  }, [])

  if (!assignments || !courses || !inbox || !scales || !attendance || !notes || !reading || !settings) return null
  const pendingInbox = inbox.filter((i) => !i.sorted).length

  function closeForm() {
    // an inbox item is marked sorted only once its assignment was actually saved
    setDraft(null)
    setFromInbox(null)
  }

  async function onSaved() {
    if (fromInbox) await repo.inbox.put({ ...fromInbox, sorted: true })
  }

  return (
    <>
      <div className="pagehead">
        <p className="mono">{`${assignments.filter((a) => a.status !== 'done').length} open · ${courses.length} courses`}</p>
        <h1>School</h1>
      </div>

      <nav className="tabs" aria-label="School sections">
        {TABS.map((t) => (
          <a key={t.id} href={`#/school${t.id ? `/${t.id}` : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
            {t.label}{t.id === 'inbox' && pendingInbox > 0 ? ` (${pendingInbox})` : ''}
          </a>
        ))}
        <span className="grow" />
        <button className="btn ghost" type="button" onClick={() => setWizard(true)}>Set up semester</button>
        <button className="btn" type="button" onClick={() => setDraft({ title: '' })}>New assignment</button>
      </nav>

      {courses.length === 0 && tab === '' && (
        <div className="empty" style={{ marginBottom: 20 }}>
          <p><b>Start here.</b> Add your classes first so assignments have somewhere to live.</p>
          <button className="btn" type="button" onClick={() => setWizard(true)}>Set up your semester</button>
        </div>
      )}

      {tab === '' && (
        <>
          <QuickAdd courses={courses} today={today} onNeedsForm={(d) => setDraft(d)} />
          <AssignmentList assignments={assignments} courses={courses} now={now} today={today} onEdit={(a: Assignment) => setDraft(a)} />
        </>
      )}
      {tab === 'courses' && <CoursesPanel courses={courses} />}
      {tab === 'grades' && <GradesPanel courses={courses} assignments={assignments} scales={scales} />}
      {tab === 'attendance' && <AttendancePanel courses={courses} records={attendance} notes={notes} today={today} rotationStart={settings.rotationStart} />}
      {tab === 'reading' && <ReadingPanel items={reading} courses={courses} today={today} />}
      {tab === 'inbox' && <InboxPanel items={inbox} courses={courses} today={today} onSort={(d, item) => { setFromInbox(item); setDraft(d) }} />}

      <AssignmentForm draft={draft} courses={courses} today={today} onClose={closeForm} onSaved={onSaved} />
      <SetupWizard open={wizard} onClose={() => setWizard(false)} today={today} />
    </>
  )
}
