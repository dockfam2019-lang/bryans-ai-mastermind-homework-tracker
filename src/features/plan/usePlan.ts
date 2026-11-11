import { repo } from '../../data'
import { DAY_SHORT, formatTime, fromLocalDate } from '../../domain/dates'
import { livePlan, type Suggestion } from '../../domain/livePlan'
import { DEFAULT_STUDY_MINUTES } from '../../domain/scheduler'
import { useLive, useNow } from '../../ui/hooks'
import { showToast } from '../../ui/toast'

/** The one plan shown on Week, Plan and Today: saved blocks plus live, timed suggestions. */
export function usePlan() {
  const now = useNow()
  const assignments = useLive(() => repo.assignments.all())
  const blocks = useLive(() => repo.studyBlocks.all())
  const courses = useLive(() => repo.courses.all())
  const windows = useLive(() => repo.energyWindows.all())
  const settings = useLive(() => repo.settings.get('main'))
  if (!assignments || !blocks || !courses || !windows || !settings) return undefined
  const plan = livePlan({ assignments, blocks, courses, windows, now, perDay: settings.studyMinutesPerDay ?? DEFAULT_STUDY_MINUTES, rotationStart: settings.rotationStart })
  return { now, assignments, blocks, courses, settings, ...plan }
}

/** "Lab report, 60 min, Wed 4 pm": used for button labels so each one is distinct. */
export function describeSuggestion(s: Suggestion, title: string): string {
  const d = fromLocalDate(s.date)
  return `${title}, ${s.minutes} min, ${DAY_SHORT[d.getDay()]}${s.start ? ` ${formatTime(s.start)}` : ''}`
}

export async function acceptSuggestion(s: Suggestion, title: string, date = s.date, quiet = false) {
  const saved = s.savedId
    ? await repo.studyBlocks.put({ ...(await repo.studyBlocks.get(s.savedId))!, state: 'accepted', date, start: date === s.date ? s.start : undefined })
    : await repo.studyBlocks.put({ assignmentId: s.assignmentId, date, start: date === s.date ? s.start : undefined, minutes: s.minutes, state: 'accepted', examPrep: s.examPrep, label: s.label })
  if (!quiet) showToast(`Planned: ${describeSuggestion({ ...s, date }, title)}.`, { actionLabel: 'Undo', onAction: () => void (s.savedId ? repo.studyBlocks.put({ ...saved, state: 'suggested' }) : repo.studyBlocks.remove(saved.id)) })
  return saved
}

export async function dismissSuggestion(s: Suggestion, title: string) {
  const saved = s.savedId
    ? await repo.studyBlocks.put({ ...(await repo.studyBlocks.get(s.savedId))!, state: 'dismissed' })
    : await repo.studyBlocks.put({ assignmentId: s.assignmentId, date: s.date, minutes: s.minutes, state: 'dismissed' })
  showToast(`Skipped ${title} on ${DAY_SHORT[fromLocalDate(s.date).getDay()]}. It will not be suggested for that day again.`, { actionLabel: 'Undo', onAction: () => void (s.savedId ? repo.studyBlocks.put({ ...saved, state: 'suggested' }) : repo.studyBlocks.remove(saved.id)) })
}
