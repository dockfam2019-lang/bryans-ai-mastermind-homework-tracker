// Decides which reminders are due right now. Pure: the caller keeps the set of keys already
// shown, so a reminder fires once. Delivery (system notification or in-app notice) is in src/ui.
import { addDays, dueAt, formatTime, toLocalDate } from './dates'
import { classesOn } from './schedule'
import type { Assignment, Course, LocalDate } from './types'

export interface Reminder {
  key: string
  title: string
  body: string
}

const LEAD_MINUTES = 60
const CLASS_LEAD_MINUTES = 10
const DIGEST_HOUR = 18

export function dueReminders(assignments: Assignment[], now: Date, fired: ReadonlySet<string>): Reminder[] {
  const out: Reminder[] = []
  const open = assignments.filter((a) => a.status !== 'done')

  // one hour before an item is due
  for (const a of open) {
    const mins = Math.round((dueAt(a.dueDate, a.dueTime).getTime() - now.getTime()) / 60000)
    if (a.dueTime && mins >= 0 && mins <= LEAD_MINUTES) {
      const key = `lead:${a.id}:${a.dueDate}:${a.dueTime}`
      if (!fired.has(key)) out.push({ key, title: a.title, body: mins === 0 ? 'Due now' : `Due in ${mins} min` })
    }
  }

  // evening digest of what is due tomorrow
  if (now.getHours() >= DIGEST_HOUR) {
    const tomorrow = addDays(toLocalDate(now), 1)
    const items = open.filter((a) => a.dueDate === tomorrow)
    const key = `digest:${tomorrow}`
    if (items.length > 0 && !fired.has(key)) {
      const names = items.slice(0, 3).map((a) => a.title).join(', ')
      out.push({ key, title: `${items.length} due tomorrow`, body: items.length > 3 ? `${names} and ${items.length - 3} more` : names })
    }
  }
  return out
}

/** Alerts shortly before a class starts. */
export function classAlerts(courses: Course[], now: Date, fired: ReadonlySet<string>, rotationStart?: LocalDate): Reminder[] {
  const date = toLocalDate(now)
  const out: Reminder[] = []
  for (const { course, meeting } of classesOn(courses, date, rotationStart)) {
    const [h, m] = meeting.start.split(':').map(Number)
    const mins = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime() - now.getTime()) / 60000)
    const key = `class:${course.id}:${date}:${meeting.start}`
    if (mins >= 0 && mins <= CLASS_LEAD_MINUTES && !fired.has(key)) {
      out.push({ key, title: course.name, body: `Starts at ${formatTime(meeting.start)}${meeting.room ? ` in ${meeting.room}` : ''}` })
    }
  }
  return out
}
