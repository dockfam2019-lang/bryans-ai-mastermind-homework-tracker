// Which class meetings happen on a given date, including A/B rotating schedules.
// Rotation counts school days (Monday to Friday) from `rotationStart`, which is an "A" day.
import { addDays, diffDays, weekday } from './dates'
import type { Course, LocalDate, Meeting } from './types'

export interface ClassOccurrence {
  course: Course
  meeting: Meeting
  date: LocalDate
}

function isSchoolDay(d: LocalDate): boolean {
  const w = weekday(d)
  return w !== 0 && w !== 6
}

/** Signed number of school days from `from` to `to` (forward: days after `from` up to `to`; backward: days from `to` up to before `from`). */
function schoolDaysBetween(from: LocalDate, to: LocalDate): number {
  const n = diffDays(from, to)
  let count = 0
  if (n >= 0) {
    for (let i = 1; i <= n; i++) if (isSchoolDay(addDays(from, i))) count++
    return count
  }
  for (let i = 0; i < -n; i++) if (isSchoolDay(addDays(to, i))) count++
  return -count
}

/** "A" on even school-day counts from `rotationStart` (an A day), "B" on odd. Weekends repeat the day before. */
export function rotationLetter(date: LocalDate, rotationStart: LocalDate): 'A' | 'B' {
  return Math.abs(schoolDaysBetween(rotationStart, date)) % 2 === 0 ? 'A' : 'B'
}

export function classesOn(courses: Course[], date: LocalDate, rotationStart?: LocalDate): ClassOccurrence[] {
  const out: ClassOccurrence[] = []
  const w = weekday(date)
  for (const course of courses) {
    for (const meeting of course.schedule.meetings) {
      if (!meeting.days.includes(w)) continue
      if (course.schedule.kind === 'rotating' && meeting.rotation && meeting.rotation !== 'both') {
        if (!rotationStart || rotationLetter(date, rotationStart) !== meeting.rotation) continue
      }
      out.push({ course, meeting, date })
    }
  }
  return out.sort((a, b) => a.meeting.start.localeCompare(b.meeting.start))
}
