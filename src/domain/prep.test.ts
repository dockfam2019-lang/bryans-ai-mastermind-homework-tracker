import { describe, expect, it } from 'vitest'
import { examPrepPlan } from './prep'
import type { Assignment } from './types'

const exam = (dueDate: string, estimatedMinutes?: number): Assignment => ({
  id: 'e', createdAt: 0, updatedAt: 0, courseId: 'c', title: 'Unit 5 exam', dueDate, type: 'exam', priority: 3, status: 'todo', estimatedMinutes, subtasks: [], tags: [], attachmentIds: [],
})

describe('examPrepPlan', () => {
  it('works backward from the exam with a heavy start and a light last day', () => {
    const plan = examPrepPlan(exam('2026-11-13', 150), '2026-11-10')
    expect(plan.map((s) => [s.date, s.minutes])).toEqual([['2026-11-10', 65], ['2026-11-11', 55], ['2026-11-12', 30]])
    expect(plan[0].label).toBe('Review notes and flag weak spots')
    expect(plan.at(-1)?.label).toBe('Light review and an early night')
  })

  it('caps preparation at seven days and never starts before today', () => {
    const plan = examPrepPlan(exam('2026-12-20', 210), '2026-11-10')
    expect(plan).toHaveLength(7)
    expect(plan[0].date).toBe('2026-12-13')
    expect(plan.at(-1)?.date).toBe('2026-12-19')
  })

  it('gives a single review session when the exam is tomorrow', () => {
    const plan = examPrepPlan(exam('2026-11-11', 90), '2026-11-10')
    expect(plan).toEqual([{ date: '2026-11-10', minutes: 90, label: 'Review everything once, then rest' }])
  })

  it('returns nothing for an exam that is today or past, and uses a default estimate', () => {
    expect(examPrepPlan(exam('2026-11-10'), '2026-11-10')).toEqual([])
    expect(examPrepPlan(exam('2026-11-05'), '2026-11-10')).toEqual([])
    const plan = examPrepPlan(exam('2026-11-12'), '2026-11-10')
    expect(plan.reduce((s, p) => s + p.minutes, 0)).toBeGreaterThanOrEqual(140)
  })
})
