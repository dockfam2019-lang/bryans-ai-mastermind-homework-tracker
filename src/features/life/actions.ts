import { repo } from '../../data'
import { addDays, toLocalDate } from '../../domain/dates'
import { makeLog } from '../../domain/hobbies'
import type { Hobby, Log, Pause } from '../../domain/types'
import { showToast } from '../../ui/toast'

export type CheckInExtra = Parameters<typeof makeLog>[2]

/** One-tap check-in for right now, with Undo. */
export async function checkIn(hobby: Hobby, extra: CheckInExtra = {}, now = new Date()): Promise<Log> {
  const log = await repo.logs.put(makeLog(hobby.id, now, extra))
  showToast(`Checked in: ${hobby.name}.`, { actionLabel: 'Undo', onAction: () => void repo.logs.remove(log.id) })
  return log
}

export async function removeLog(log: Log) {
  await repo.logs.remove(log.id)
  showToast('Entry deleted.', { actionLabel: 'Undo', onAction: () => void repo.logs.put(log) })
}

export async function saveBlob(file: File): Promise<string> {
  const rec = await repo.blobs.put({ name: file.name, type: file.type, blob: file })
  return rec.id
}

/** Freeze yesterday for one hobby (forgives a single missed day). */
export async function freezeYesterday(hobby: Hobby, today: string) {
  const day = addDays(today, -1)
  const freeze = await repo.pauses.put({ hobbyId: hobby.id, kind: 'freeze', start: day, end: day })
  showToast(`Yesterday is frozen for ${hobby.name}. Your streak is safe.`, { actionLabel: 'Undo', onAction: () => void repo.pauses.remove(freeze.id) })
}

/** Vacation mode: pause every hobby from today until resumed. */
export async function pauseAll(today = toLocalDate(new Date())) {
  const p = await repo.pauses.put({ hobbyId: '*', kind: 'pause', start: today })
  showToast('Paused. Nothing will count against you until you resume.', { actionLabel: 'Undo', onAction: () => void repo.pauses.remove(p.id) })
}

export async function resumeAll(open: Pause, today = toLocalDate(new Date())) {
  // end the pause yesterday so today is expected again
  const end = addDays(today, -1)
  if (end < open.start) await repo.pauses.remove(open.id)
  else await repo.pauses.put({ ...open, end })
  showToast('Welcome back.')
}
