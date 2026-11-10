// iCalendar (.ics) export and import for assignments. Plain text, no library.
import { addDays, toLocalDate } from './dates'
import type { Assignment, Course, LocalDate, TimeOfDay } from './types'

const pad = (n: number) => String(n).padStart(2, '0')
const compactDate = (d: LocalDate) => d.replace(/-/g, '')
const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const unescapeText = (s: string) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1')

/** Lines longer than 75 characters are folded onto continuation lines that start with a space. */
export function fold(line: string): string {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74))
  return parts.join('\r\n')
}

function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

export function toIcs(assignments: Assignment[], courses: Course[], now: Date = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Studyboard//Assignments//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Studyboard']
  for (const a of assignments) {
    const course = courses.find((c) => c.id === a.courseId)
    lines.push('BEGIN:VEVENT', `UID:${a.id}@studyboard`, `DTSTAMP:${utcStamp(now)}`, fold(`SUMMARY:${escapeText(course ? `${course.name}: ${a.title}` : a.title)}`))
    if (a.dueTime) {
      lines.push(`DTSTART:${compactDate(a.dueDate)}T${a.dueTime.replace(':', '')}00`, 'DURATION:PT15M')
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(a.dueDate)}`, `DTEND;VALUE=DATE:${compactDate(addDays(a.dueDate, 1))}`)
    }
    const desc = [a.type, a.estimatedMinutes ? `about ${a.estimatedMinutes} min` : '', a.notes ?? ''].filter(Boolean).join('. ')
    if (desc) lines.push(fold(`DESCRIPTION:${escapeText(desc)}`))
    lines.push(`STATUS:${a.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`, 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

export interface IcsEvent {
  summary: string
  date: LocalDate
  time?: TimeOfDay
  description?: string
}

function parseStart(value: string): { date: LocalDate; time?: TimeOfDay } | undefined {
  const m = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return undefined
  const [, y, mo, d, hh, mm, , z] = m
  if (hh === undefined) return { date: `${y}-${mo}-${d}` }
  if (z) {
    const local = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm)))
    return { date: toLocalDate(local), time: `${pad(local.getHours())}:${pad(local.getMinutes())}` }
  }
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mm}` }
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/)
  const events: IcsEvent[] = []
  let cur: Record<string, string> | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {}
    else if (line === 'END:VEVENT') {
      if (cur?.SUMMARY && cur.DTSTART) {
        const start = parseStart(cur.DTSTART)
        if (start) events.push({ summary: unescapeText(cur.SUMMARY), ...start, description: cur.DESCRIPTION ? unescapeText(cur.DESCRIPTION) : undefined })
      }
      cur = null
    } else if (cur) {
      const i = line.indexOf(':')
      if (i < 0) continue
      const name = line.slice(0, i).split(';')[0].toUpperCase()
      if (name === 'SUMMARY' || name === 'DTSTART' || name === 'DESCRIPTION') cur[name] = line.slice(i + 1)
    }
  }
  return events
}
