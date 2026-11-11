import { describe, expect, it } from 'vitest'
import { bucketize, itemStatus } from './status'
import type { Assignment } from './types'

const mk = (id: string, dueDate: string, dueTime?: string, status: Assignment['status'] = 'todo'): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, dueTime, type: 'homework', priority: 2, status, subtasks: [], tags: [], attachmentIds: [],
})
// Wednesday Nov 11, 2:25 pm
const now = new Date(2026, 10, 11, 14, 25)

describe('itemStatus', () => {
  it('calls yesterday’s quiz overdue, not due today', () => {
    expect(itemStatus(mk('quiz', '2026-11-10', '14:10'), now)).toBe('overdue')
  })
  it('calls something due earlier today overdue once its time has passed', () => {
    expect(itemStatus(mk('a', '2026-11-11', '09:00'), now)).toBe('overdue')
    expect(itemStatus(mk('b', '2026-11-11', '17:00'), now)).toBe('dueToday')
    expect(itemStatus(mk('c', '2026-11-11'), now)).toBe('dueToday') // no time: due by end of day
  })
  it('handles upcoming and done', () => {
    expect(itemStatus(mk('d', '2026-11-13', '09:00'), now)).toBe('upcoming')
    expect(itemStatus(mk('e', '2026-11-01', '09:00', 'done'), now)).toBe('done')
  })
})

describe('bucketize', () => {
  it('puts every item in exactly one bucket, sorted by due time', () => {
    const b = bucketize([mk('later', '2026-11-20'), mk('quiz', '2026-11-10', '14:10'), mk('tonight', '2026-11-11', '20:00'), mk('older', '2026-11-08'), mk('x', '2026-11-01', undefined, 'done')], now)
    expect(b.overdue.map((a) => a.id)).toEqual(['older', 'quiz'])
    expect(b.dueToday.map((a) => a.id)).toEqual(['tonight'])
    expect(b.upcoming.map((a) => a.id)).toEqual(['later'])
    expect(b.done.map((a) => a.id)).toEqual(['x'])
  })
})
