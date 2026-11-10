import { describe, expect, it } from 'vitest'
import { assignStartTimes, learnWindows } from './energy'
import type { Assignment, EnergyWindow, FocusSession, StudyBlock } from './types'

const win = (startHour: number, endHour: number, rating: EnergyWindow['rating']): EnergyWindow => ({ id: `${startHour}${rating}`, createdAt: 0, updatedAt: 0, startHour, endHour, rating })
const asg = (id: string, difficulty: number): Assignment => ({ id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate: '2026-11-12', type: 'homework', priority: 2, status: 'todo', difficulty: difficulty as 1, subtasks: [], tags: [], attachmentIds: [] })
const blk = (id: string, assignmentId: string, minutes: number, start?: string): StudyBlock => ({ id, createdAt: 0, updatedAt: 0, assignmentId, date: '2026-11-10', minutes, state: 'accepted', start })

const windows = [win(16, 18, 'best'), win(19, 21, 'worst'), win(14, 15, 'ok')]
const assignments = [asg('hard', 5), asg('easy', 1)]

describe('assignStartTimes', () => {
  it('puts hard work in the best window and easy work in the worst', () => {
    const out = assignStartTimes({ blocks: [blk('b1', 'easy', 30), blk('b2', 'hard', 60)], assignments, windows, busy: () => [] })
    expect(out.find((b) => b.id === 'b2')?.start).toBe('16:00')
    expect(out.find((b) => b.id === 'b1')?.start).toBe('19:00')
  })

  it('works around classes and blocks already placed', () => {
    const out = assignStartTimes({ blocks: [blk('b1', 'hard', 60), blk('b2', 'hard', 60)], assignments, windows, busy: () => [{ start: 16 * 60, end: 16 * 60 + 30 }] })
    expect(out.find((b) => b.id === 'b1')?.start).toBe('16:30') // first 60 minute gap in 16:00 to 18:00 starts after the class
    expect(out.find((b) => b.id === 'b2')?.start).toBe('14:00') // only 30 minutes of the best window are left, so it falls to the next best
  })

  it('keeps existing start times and leaves blocks that fit nowhere unchanged', () => {
    const out = assignStartTimes({ blocks: [blk('keep', 'hard', 30, '09:00'), blk('big', 'hard', 300)], assignments, windows, busy: () => [] })
    expect(out.find((b) => b.id === 'keep')?.start).toBe('09:00')
    expect(out.find((b) => b.id === 'big')?.start).toBeUndefined()
  })

  it('does nothing without windows', () => {
    expect(assignStartTimes({ blocks: [blk('b', 'hard', 30)], assignments, windows: [], busy: () => [] })[0].start).toBeUndefined()
  })
})

describe('learnWindows', () => {
  const s = (hour: number, minutes: number): FocusSession => ({ id: `${hour}${Math.random()}`, createdAt: 0, updatedAt: 0, targetType: 'assignment', targetId: 'x', localDate: '2026-11-10', startedAt: new Date(2026, 10, 10, hour, 0).getTime(), minutes })

  it('needs at least five sessions', () => {
    expect(learnWindows([s(16, 25), s(16, 25)])).toBeNull()
  })

  it('finds the hours when focus really happens and merges neighbouring hours', () => {
    const sessions = [s(16, 50), s(16, 50), s(17, 50), s(17, 50), s(10, 30), s(20, 10)]
    const r = learnWindows(sessions)!
    expect(r.byHour[16]).toBe(100)
    expect(r.suggested).toEqual([{ startHour: 10, endHour: 11, rating: 'ok' }, { startHour: 16, endHour: 18, rating: 'best' }])
    expect(r.byWeekday[2]).toBe(100 + 100 + 30 + 10) // all on a Tuesday
  })
})
