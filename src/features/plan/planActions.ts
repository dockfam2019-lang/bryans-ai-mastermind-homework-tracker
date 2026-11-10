import { repo } from '../../data'
import { examPrepPlan } from '../../domain/prep'
import { suggestPlan, type PlanResult } from '../../domain/scheduler'
import type { Assignment, StudyBlock } from '../../domain/types'
import { showToast } from '../../ui/toast'

/**
 * Replaces the current suggestions with a fresh plan. Accepted and finished blocks are kept, and
 * labelled prep suggestions (from an exam prep plan) are kept and counted as planned time.
 */
export async function generatePlan(assignments: Assignment[], today: string, perDay: number): Promise<PlanResult> {
  const existing = await repo.studyBlocks.all()
  const stale = existing.filter((b) => b.state === 'suggested' && !b.label)
  for (const b of stale) await repo.studyBlocks.remove(b.id)
  const keep = existing.filter((b) => !stale.includes(b)).map((b) => (b.state === 'suggested' ? { ...b, state: 'accepted' as const } : b))
  const result = suggestPlan({ assignments, existing: keep, today, perDay })
  for (const b of result.blocks) await repo.studyBlocks.put(b)
  return result
}

/** Adds a backward-built prep plan for an exam as suggestions. Replaces any earlier prep suggestions for it. */
export async function createPrepBlocks(exam: Assignment, today: string): Promise<number> {
  const steps = examPrepPlan(exam, today)
  const existing = await repo.studyBlocks.byIndex('assignmentId', exam.id)
  for (const b of existing.filter((x) => x.state === 'suggested' && x.label)) await repo.studyBlocks.remove(b.id)
  for (const s of steps) await repo.studyBlocks.put({ assignmentId: exam.id, date: s.date, minutes: s.minutes, label: s.label, state: 'suggested', examPrep: true })
  showToast(steps.length ? `Prep plan added: ${steps.length} ${steps.length === 1 ? 'session' : 'sessions'} before ${exam.title}. Accept them in Week, Plan.` : 'The exam is today or past, so there is nothing to plan.')
  return steps.length
}

const setState = (b: StudyBlock, state: StudyBlock['state']) => repo.studyBlocks.put({ ...b, state })

export const acceptBlock = (b: StudyBlock) => setState(b, 'accepted')
export const markBlockDone = (b: StudyBlock) => setState(b, 'done')

export async function dismissBlock(b: StudyBlock) {
  await setState(b, 'dismissed')
  showToast('Dismissed. It will not be suggested for that day again.', { actionLabel: 'Undo', onAction: () => void repo.studyBlocks.put(b) })
}

export async function removeBlock(b: StudyBlock) {
  await repo.studyBlocks.remove(b.id)
  showToast('Block removed.', { actionLabel: 'Undo', onAction: () => void repo.studyBlocks.put(b) })
}

export const moveBlock = (b: StudyBlock, date: string) => repo.studyBlocks.put({ ...b, date, state: b.state === 'suggested' ? 'accepted' : b.state })
