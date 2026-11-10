import { describe, expect, it } from 'vitest'
import { dueOn, nextUp, openAssignments, overdue } from './upcoming'
import type { Assignment } from './types'

const mk = (id: string, dueDate: string, dueTime: string | undefined, status: Assignment['status'] = 'todo'): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, dueTime, type: 'homework', priority: 2, status,
  subtasks: [], tags: [], attachmentIds: [],
})

const now = new Date(2026, 10, 10, 12, 0)
const rows = [mk('lab', '2026-11-13', '09:00'), mk('quiz', '2026-11-10', '14:10'), mk('old', '2026-11-08', '09:00'), mk('done', '2026-11-10', '09:00', 'done')]

describe('upcoming', () => {
  it('orders open assignments by due time, overdue first', () => {
    expect(openAssignments(rows).map((a) => a.id)).toEqual(['old', 'quiz', 'lab'])
  })
  it('picks the next assignment not yet past due', () => {
    expect(nextUp(rows, now)?.id).toBe('quiz')
  })
  it('falls back to the oldest overdue item when everything is past due', () => {
    expect(nextUp([mk('old', '2026-11-08', '09:00')], now)?.id).toBe('old')
  })
  it('lists items due on a date and overdue items', () => {
    expect(dueOn(rows, '2026-11-10').map((a) => a.id)).toEqual(['quiz'])
    expect(overdue(rows, now).map((a) => a.id)).toEqual(['old'])
  })
})
