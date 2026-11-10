import { repo } from '../../data'
import { toLocalDate } from '../../domain/dates'
import type { GameInput } from '../../domain/game'
import { computeStreak } from '../../domain/streaks'
import { useLive, useNow } from '../../ui/hooks'

/** Everything the Insights and Game screens need, loaded live. Returns undefined until all of it has arrived. */
export function useInsightsData() {
  const now = useNow()
  const today = toLocalDate(now)
  const assignments = useLive(() => repo.assignments.all())
  const courses = useLive(() => repo.courses.all())
  const hobbies = useLive(() => repo.hobbies.all())
  const logs = useLive(() => repo.logs.all())
  const pauses = useLive(() => repo.pauses.all())
  const focusSessions = useLive(() => repo.focusSessions.all())
  const attendance = useLive(() => repo.attendance.all())
  const moods = useLive(() => repo.moods.all())
  const windows = useLive(() => repo.energyWindows.all())
  const readingItems = useLive(() => repo.readingItems.all())
  const blocks = useLive(() => repo.studyBlocks.all())
  const settings = useLive(() => repo.settings.get('main'))

  if (!assignments || !courses || !hobbies || !logs || !pauses || !focusSessions || !attendance || !moods || !windows || !readingItems || !blocks || !settings) return undefined

  const active = hobbies.filter((h) => !h.archived)
  const bestStreak = Math.max(0, ...active.map((h) => computeStreak({ hobby: h, logs, pauses, today, weekStart: settings.weekStart }).best))
  const game: GameInput = { assignments, focusSessions, logs, attendance, readingItems, bestStreak, today, weekStart: settings.weekStart }
  return { now, today, assignments, courses, hobbies: active, logs, pauses, focusSessions, attendance, moods, windows, readingItems, blocks, settings, game }
}

export type InsightsData = NonNullable<ReturnType<typeof useInsightsData>>
