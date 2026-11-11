import { describe, expect, it } from 'vitest'
import { livePlan } from './livePlan'
import type { Assignment, Course, StudyBlock } from './types'

const mk = (id: string, dueDate: string, estimatedMinutes: number, over: Partial<Assignment> = {}): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, type: 'homework', priority: 2, status: 'todo', estimatedMinutes, subtasks: [], tags: [], attachmentIds: [], ...over,
})
const course: Course = { id: 'c', name: 'Chem', color: '#fff', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [{ days: [3], start: '16:00', end: '17:00' }] } } // Wednesdays 4 to 5 pm
const now = new Date(2026, 10, 11, 14, 25) // Wed Nov 11, 2:25 pm

describe('livePlan', () => {
  it('flags overdue items instead of planning them', () => {
    const p = livePlan({ assignments: [mk('quiz', '2026-11-10', 45, { dueTime: '14:10' })], blocks: [], courses: [], windows: [], now })
    expect(p.suggestions).toEqual([])
    expect(p.overdue.map((a) => a.id)).toEqual(['quiz'])
  })

  it('gives suggestions real times in default windows, avoiding classes and the past', () => {
    const hard = livePlan({ assignments: [mk('lab', '2026-11-13', 60, { dueTime: '18:00', difficulty: 5 })], blocks: [], courses: [course], windows: [], now })
    expect(hard.suggestions.find((s) => s.date === '2026-11-11')?.start).toBe('17:00') // best window is 4 to 6, but 4 to 5 is class
    expect(hard.suggestions.every((s) => s.start)).toBe(true)
    // light work goes to the low-energy hour first, and never before now (2:25 pm)
    const light = livePlan({ assignments: [mk('sheet', '2026-11-13', 30, { dueTime: '18:00', difficulty: 1 })], blocks: [], courses: [course], windows: [], now })
    expect(light.suggestions.find((s) => s.date === '2026-11-11')?.start).toBe('15:00')
  })

  it('uses your own energy windows when set', () => {
    const p = livePlan({ assignments: [mk('lab', '2026-11-12', 30, { difficulty: 5 })], blocks: [], courses: [], windows: [{ startHour: 19, endHour: 21, rating: 'best' }], now })
    expect(p.suggestions[0].start).toBe('19:00')
  })

  it('keeps saved prep suggestions, and does not double count accepted time', () => {
    const blocks: StudyBlock[] = [
      { id: 'prep', createdAt: 0, updatedAt: 0, assignmentId: 'exam', date: '2026-11-12', minutes: 40, state: 'suggested', label: 'Review notes', examPrep: true },
      { id: 'acc', createdAt: 0, updatedAt: 0, assignmentId: 'lab', date: '2026-11-11', minutes: 60, state: 'accepted', start: '19:00' },
    ]
    const p = livePlan({ assignments: [mk('exam', '2026-11-14', 40, { type: 'exam' }), mk('lab', '2026-11-13', 60)], blocks, courses: [], windows: [], now })
    expect(p.suggestions.find((s) => s.savedId === 'prep')?.label).toBe('Review notes')
    expect(p.suggestions.filter((s) => s.assignmentId === 'lab')).toEqual([]) // its 60 minutes are already planned
  })

  it('leaves a short break between suggestions so they never touch or overlap', () => {
    const p = livePlan({ assignments: [mk('a', '2026-11-12', 30, { difficulty: 5 }), mk('b', '2026-11-12', 30, { difficulty: 5 }), mk('c', '2026-11-12', 15, { difficulty: 5 })], blocks: [], courses: [], windows: [], now })
    const today = p.suggestions.filter((s) => s.date === '2026-11-11' && s.start).map((s) => [Number(s.start!.slice(0, 2)) * 60 + Number(s.start!.slice(3)), s.minutes]).sort((x, y) => x[0] - y[0])
    for (let i = 1; i < today.length; i++) expect(today[i][0]).toBeGreaterThanOrEqual(today[i - 1][0] + today[i - 1][1] + 10)
  })
})

