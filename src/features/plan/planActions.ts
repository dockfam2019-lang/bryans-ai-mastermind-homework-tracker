import { repo } from '../../data'
import { examPrepPlan } from '../../domain/prep'
import type { Assignment, StudyBlock } from '../../domain/types'
import { showToast } from '../../ui/toast'

/** Adds a backward-built prep plan for an exam as suggestions. Replaces any earlier prep suggestions for it. */
export async function createPrepBlocks(exam: Assignment, today: string): Promise<number> {
  const steps = examPrepPlan(exam, today)
  const existing = await repo.studyBlocks.byIndex('assignmentId', exam.id)
  for (const b of existing.filter((x) => x.state === 'suggested' && x.label)) await repo.studyBlocks.remove(b.id)
  for (const s of steps) await repo.studyBlocks.put({ assignmentId: exam.id, date: s.date, minutes: s.minutes, label: s.label, state: 'suggested', examPrep: true })
  showToast(steps.length ? `Prep plan added: ${steps.length} ${steps.length === 1 ? 'session' : 'sessions'} before ${exam.title}. They show as suggestions on Week, Plan and Today.` : 'The exam is today or past, so there is nothing to plan.')
  return steps.length
}

const setState = (b: StudyBlock, state: StudyBlock['state']) => repo.studyBlocks.put({ ...b, state })

export const markBlockDone = (b: StudyBlock) => setState(b, 'done')


export async function removeBlock(b: StudyBlock) {
  await repo.studyBlocks.remove(b.id)
  showToast('Block removed.', { actionLabel: 'Undo', onAction: () => void repo.studyBlocks.put(b) })
}

