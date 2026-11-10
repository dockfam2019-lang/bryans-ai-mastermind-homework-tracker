import { describe, expect, it } from 'vitest'
import { capacityFor, plannedMinutes, suggestPlan } from './scheduler'
import type { Assignment, StudyBlock } from './types'

const mk = (id: string, dueDate: string, estimatedMinutes: number, over: Partial<Assignment> = {}): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, type: 'homework', priority: 2, status: 'todo', estimatedMinutes, subtasks: [], tags: [], attachmentIds: [], ...over,
})
const block = (assignmentId: string, date: string, minutes: number, state: StudyBlock['state']): StudyBlock => ({ id: assignmentId + date, createdAt: 0, updatedAt: 0, assignmentId, date, minutes, state })
const today = '2026-11-10' // Tuesday

describe('capacityFor', () => {
  it('gives weekends three quarters of the weekday time, rounded to 5 minutes', () => {
    expect(capacityFor('2026-11-10')).toBe(120)
    expect(capacityFor('2026-11-14')).toBe(90) // Saturday
    expect(capacityFor('2026-11-14', 100)).toBe(75)
  })
})

describe('suggestPlan', () => {
  it('places one block a day, front-loading until the work is covered', () => {
    const r = suggestPlan({ assignments: [mk('lab', '2026-11-13', 150)], existing: [], today })
    expect(r.blocks.map((b) => [b.date, b.minutes])).toEqual([['2026-11-10', 60], ['2026-11-11', 60], ['2026-11-12', 30]])
    expect(r.shortfalls).toEqual([])
  })

  it('serves the earliest due date first when time is tight', () => {
    const r = suggestPlan({ assignments: [mk('later', '2026-11-12', 60), mk('soon', '2026-11-10', 60)], existing: [], today, perDay: 60 })
    expect(r.blocks[0]).toMatchObject({ assignmentId: 'soon', date: '2026-11-10' })
    expect(r.blocks.find((b) => b.assignmentId === 'later')?.date).toBe('2026-11-11')
  })

  it('reports a shortfall when there is not enough time before the due date', () => {
    const r = suggestPlan({ assignments: [mk('big', '2026-11-11', 300)], existing: [], today, perDay: 60 })
    expect(r.blocks.reduce((s, b) => s + b.minutes, 0)).toBe(120)
    expect(r.shortfalls).toEqual([{ assignmentId: 'big', minutes: 180 }])
  })

  it('counts accepted and done blocks as work already covered and skips dismissed days', () => {
    const existing = [block('lab', '2026-11-10', 60, 'accepted'), block('lab', '2026-11-11', 40, 'dismissed')]
    const r = suggestPlan({ assignments: [mk('lab', '2026-11-13', 150)], existing, today })
    expect(r.blocks.map((b) => [b.date, b.minutes])).toEqual([['2026-11-12', 60], ['2026-11-13', 30]])
  })

  it('does not plan done assignments and plans overdue work for today', () => {
    const r = suggestPlan({ assignments: [mk('done', '2026-11-12', 60, { status: 'done' }), mk('old', '2026-11-08', 45)], existing: [], today })
    expect(r.blocks.map((b) => [b.assignmentId, b.date])).toEqual([['old', '2026-11-10']])
  })

  it('marks exam blocks as exam prep and warns about overloaded days', () => {
    const r = suggestPlan({ assignments: [mk('exam', '2026-11-11', 300, { type: 'exam' })], existing: [], today, perDay: 60 })
    expect(r.blocks.every((b) => b.examPrep)).toBe(true)
    expect(r.overloaded.length).toBeGreaterThan(0)
    expect(r.overloaded[0]).toMatchObject({ date: '2026-11-10', capacity: 60 })
  })

  it('does not plan beyond the horizon', () => {
    const r = suggestPlan({ assignments: [mk('far', '2026-12-30', 60)], existing: [], today, horizonDays: 7 })
    expect(r.blocks.every((b) => b.date <= '2026-11-16')).toBe(true)
  })
})

describe('plannedMinutes', () => {
  it('sums non-dismissed blocks for a day', () => {
    expect(plannedMinutes([block('a', today, 30, 'accepted'), block('b', today, 20, 'suggested'), block('c', today, 99, 'dismissed'), block('d', '2026-11-11', 15, 'accepted')], today)).toBe(50)
  })
})
