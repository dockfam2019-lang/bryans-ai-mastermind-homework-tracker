import { addDays } from './dates'
import { sessionMinutes } from './streaks'
import type { FocusSession, LocalDate, Log } from './types'

export interface DayHours {
  date: LocalDate
  schoolMin: number
  hobbyMin: number
}

/** School time is focus sessions on assignments and courses; hobby time is check-ins plus focus sessions on hobbies. */
export function balanceByDay(focusSessions: FocusSession[], logs: Log[], today: LocalDate, days = 7): DayHours[] {
  const out: DayHours[] = Array.from({ length: days }, (_, i) => ({ date: addDays(today, i - days + 1), schoolMin: 0, hobbyMin: 0 }))
  const index = new Map(out.map((d, i) => [d.date, i]))
  for (const f of focusSessions) {
    const i = index.get(f.localDate)
    if (i === undefined) continue
    if (f.targetType === 'hobby') out[i].hobbyMin += f.minutes
    else out[i].schoolMin += f.minutes
  }
  for (const l of logs) {
    const i = index.get(l.localDate)
    if (i !== undefined) out[i].hobbyMin += sessionMinutes(l)
  }
  return out
}

export interface Nudge {
  tone: 'quiet' | 'balanced' | 'school-heavy' | 'hobby-heavy'
  message: string
}

/** A gentle observation, never a scolding. `dueSoon` is the number of open items due in the next 3 days. */
export function balanceNudge(days: DayHours[], dueSoon: number): Nudge {
  const school = days.reduce((s, d) => s + d.schoolMin, 0)
  const hobby = days.reduce((s, d) => s + d.hobbyMin, 0)
  const total = school + hobby
  if (total < 60) return { tone: 'quiet', message: 'Not much tracked this week yet. Start a focus session or check in on a hobby and this fills in.' }
  if (school >= 300 && school / total >= 0.9) return { tone: 'school-heavy', message: 'School is taking almost all of your tracked time this week. A short session of something you enjoy can make the rest easier.' }
  if (dueSoon > 0 && hobby / total >= 0.7) return { tone: 'hobby-heavy', message: `Your hobbies are getting most of your time and ${dueSoon} ${dueSoon === 1 ? 'thing is' : 'things are'} due in the next few days. A short study session could help.` }
  return { tone: 'balanced', message: 'Nicely balanced this week.' }
}
