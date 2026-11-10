import { describe, expect, it } from 'vitest'
import { loadByDay, peakDay, remainingMinutes } from './load'
import type { Assignment } from './types'

function make(over: Partial<Assignment>): Assignment {
  return {
    id: 'a', createdAt: 0, updatedAt: 0, courseId: 'c', title: 't', dueDate: '2026-11-10', type: 'homework',
    priority: 2, status: 'todo', subtasks: [], tags: [], attachmentIds: [], ...over,
  }
}

describe('remainingMinutes', () => {
  it('uses the estimate, a default, subtask progress and zero when done', () => {
    expect(remainingMinutes(make({ estimatedMinutes: 60 }))).toBe(60)
    expect(remainingMinutes(make({}))).toBe(45)
    expect(remainingMinutes(make({ estimatedMinutes: 60, progress: 0.5 }))).toBe(30)
    expect(remainingMinutes(make({ estimatedMinutes: 60, subtasks: [{ id: '1', title: 'a', done: true }, { id: '2', title: 'b', done: false }] }))).toBe(30)
    expect(remainingMinutes(make({ estimatedMinutes: 60, status: 'done' }))).toBe(0)
  })
})

describe('loadByDay', () => {
  it('spreads work over the three days before the due date', () => {
    const load = loadByDay([make({ dueDate: '2026-11-13', estimatedMinutes: 90 })], '2026-11-10', 7)
    expect(load.map((d) => d.minutes)).toEqual([0, 30, 30, 30, 0, 0, 0])
  })

  it('puts overdue work on the first day and ignores done work', () => {
    const load = loadByDay(
      [make({ dueDate: '2026-11-08', estimatedMinutes: 40 }), make({ dueDate: '2026-11-11', estimatedMinutes: 99, status: 'done' })],
      '2026-11-10',
      3,
    )
    expect(load.map((d) => d.minutes)).toEqual([40, 0, 0])
  })

  it('clips work that is due just beyond the window', () => {
    const load = loadByDay([make({ dueDate: '2026-11-12', estimatedMinutes: 90 })], '2026-11-10', 2)
    // lead days are 11-10..11-12, window covers the first two
    expect(load.map((d) => d.minutes)).toEqual([30, 30])
  })

  it('finds the peak day', () => {
    // 90 min due 11-13 puts 30 on 11-11..11-13; 60 min due 11-12 puts 20 on 11-10..11-12
    const load = loadByDay([make({ dueDate: '2026-11-13', estimatedMinutes: 90 }), make({ dueDate: '2026-11-12', estimatedMinutes: 60 })], '2026-11-10', 4)
    expect(load.map((d) => d.minutes)).toEqual([20, 50, 50, 30])
    expect(peakDay(load)?.date).toBe('2026-11-11') // first of the tied maximums
  })
})
