// Mood check-ins and a gentle burnout signal. This is self-tracking, not medical advice.
import { addDays } from './dates'
import type { DayHours } from './balance'
import type { DayLoad } from './load'
import type { LocalDate, MoodCheckin } from './types'

export const WELLBEING_NOTE = 'This is a self-check to help you notice patterns. It is not medical advice. If you are struggling, talk to someone you trust.'

/** Mood for each of the last `days` days (oldest first); null when there is no check-in. */
export function moodTrend(moods: MoodCheckin[], today: LocalDate, days = 14): (number | null)[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1)
    const day = moods.filter((m) => m.localDate === date)
    return day.length ? day.reduce((s, m) => s + m.mood, 0) / day.length : null
  })
}

export interface BurnoutHint {
  signals: string[]
  message: string
}

/**
 * Looks for three things: several low-mood days, a heavy week ahead, and no day off recently.
 * Any one gets a soft suggestion; more than one gets a slightly clearer one. Returns null when all is well.
 */
export function burnoutHint(args: { moods: MoodCheckin[]; load: DayLoad[]; capacity: (d: LocalDate) => number; recent: DayHours[]; today: LocalDate }): BurnoutHint | null {
  const signals: string[] = []
  const lowDays = moodTrend(args.moods, args.today, 7).filter((m) => m !== null && m <= 2).length
  if (lowDays >= 3) signals.push(`you marked ${lowDays} of the last 7 days as low`)
  const heavy = args.load.slice(0, 7).filter((d) => d.minutes > args.capacity(d.date) * 1.25).length
  if (heavy >= 3) signals.push(`${heavy} of the next 7 days look heavy`)
  const studied = args.recent.slice(-7).filter((d) => d.schoolMin > 0).length
  if (studied >= 7) signals.push('there has been schoolwork every day this week with no day off')
  if (signals.length === 0) return null
  const lead = signals.length === 1 ? 'A small heads up:' : 'A few things add up:'
  return { signals, message: `${lead} ${signals.join(', and ')}. A short break, a walk or an early night can help. ${WELLBEING_NOTE}` }
}
