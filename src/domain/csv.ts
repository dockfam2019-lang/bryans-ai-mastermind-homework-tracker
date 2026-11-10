// CSV import for assignments. Handles quoted fields, commas and newlines inside quotes.
import { toLocalDate } from './dates'
import type { Assignment, AssignmentType, Course, LocalDate } from './types'

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((x) => x.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((x) => x.trim() !== '')) rows.push(row)
  return rows
}

export function parseDateLoose(s: string, today: LocalDate): LocalDate | undefined {
  const t = s.trim()
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (!m) return undefined
  const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : Number(today.slice(0, 4))
  const d = toLocalDate(new Date(year, Number(m[1]) - 1, Number(m[2])))
  return !m[3] && d < today ? toLocalDate(new Date(year + 1, Number(m[1]) - 1, Number(m[2]))) : d
}

const HEADERS: Record<string, string[]> = {
  title: ['title', 'name', 'assignment', 'task'],
  course: ['course', 'class', 'subject'],
  due: ['due', 'due date', 'date', 'deadline'],
  time: ['time', 'due time'],
  type: ['type', 'kind'],
  estimate: ['estimate', 'minutes', 'est', 'time estimate'],
}
const TYPES: AssignmentType[] = ['homework', 'quiz', 'exam', 'project', 'reading']

export type ImportedAssignment = Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
export interface CsvResult {
  items: ImportedAssignment[]
  skipped: { line: number; reason: string }[]
}

export function assignmentsFromCsv(text: string, courses: Course[], today: LocalDate): CsvResult {
  const rows = parseCsv(text)
  const out: CsvResult = { items: [], skipped: [] }
  if (rows.length === 0) return out
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (key: string) => header.findIndex((h) => HEADERS[key].includes(h))
  const idx = Object.fromEntries(Object.keys(HEADERS).map((k) => [k, col(k)]))
  if (idx.title < 0 || idx.due < 0) { out.skipped.push({ line: 1, reason: 'Needs a title column and a due column.' }); return out }

  rows.slice(1).forEach((r, n) => {
    const line = n + 2
    const get = (k: string) => (idx[k] >= 0 ? (r[idx[k]] ?? '').trim() : '')
    const title = get('title')
    const due = parseDateLoose(get('due'), today)
    if (!title) return out.skipped.push({ line, reason: 'No title.' })
    if (!due) return out.skipped.push({ line, reason: `Could not read the date “${get('due')}”.` })
    const courseName = get('course').toLowerCase()
    const course = courses.find((c) => c.name.toLowerCase() === courseName) ?? courses.find((c) => courseName && c.name.toLowerCase().includes(courseName))
    if (!course) return out.skipped.push({ line, reason: `No course named “${get('course')}”.` })
    const type = (TYPES.find((t) => t === get('type').toLowerCase()) ?? 'homework')
    const time = get('time').match(/^(\d{1,2}):(\d{2})$/)
    const est = Number(get('estimate'))
    out.items.push({
      courseId: course.id, title, dueDate: due, dueTime: time ? `${time[1].padStart(2, '0')}:${time[2]}` : undefined, type,
      priority: type === 'quiz' || type === 'exam' ? 3 : 2, estimatedMinutes: est > 0 ? Math.round(est) : undefined,
      status: 'todo', subtasks: [], tags: [], attachmentIds: [],
    })
  })
  return out
}
