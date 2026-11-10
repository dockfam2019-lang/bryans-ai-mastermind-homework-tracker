import { describe, expect, it } from 'vitest'
import { classAlerts, dueReminders } from './reminders'
import type { Assignment, Course } from './types'

const mk = (id: string, dueDate: string, dueTime: string | undefined, status: Assignment['status'] = 'todo'): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, dueTime, type: 'homework', priority: 2, status, subtasks: [], tags: [], attachmentIds: [],
})

describe('dueReminders', () => {
  it('alerts within an hour of the due time, once', () => {
    const now = new Date(2026, 10, 10, 13, 40)
    const rows = [mk('quiz', '2026-11-10', '14:10'), mk('far', '2026-11-10', '18:00'), mk('done', '2026-11-10', '14:00', 'done')]
    const first = dueReminders(rows, now, new Set())
    expect(first).toHaveLength(1)
    expect(first[0]).toMatchObject({ title: 'quiz', body: 'Due in 30 min' })
    expect(dueReminders(rows, now, new Set(first.map((r) => r.key)))).toHaveLength(0)
  })

  it('skips items without a due time and items already past due', () => {
    const now = new Date(2026, 10, 10, 13, 40)
    expect(dueReminders([mk('a', '2026-11-10', undefined), mk('b', '2026-11-10', '13:00')], now, new Set())).toHaveLength(0)
  })

  it('sends one evening digest for tomorrow', () => {
    const rows = [mk('a', '2026-11-11', '09:00'), mk('b', '2026-11-11', undefined), mk('c', '2026-11-12', undefined)]
    expect(dueReminders(rows, new Date(2026, 10, 10, 17, 0), new Set())).toHaveLength(0)
    const out = dueReminders(rows, new Date(2026, 10, 10, 18, 5), new Set())
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ key: 'digest:2026-11-11', title: '2 due tomorrow', body: 'a, b' })
    expect(dueReminders(rows, new Date(2026, 10, 10, 19, 0), new Set(['digest:2026-11-11']))).toHaveLength(0)
  })
})

describe('classAlerts', () => {
  const alg: Course = { id: 'alg', name: 'Algebra II', color: '#fff', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [{ days: [2], start: '09:15', end: '10:15', room: '204' }] } }
  it('alerts ten minutes before a class and not earlier', () => {
    expect(classAlerts([alg], new Date(2026, 10, 10, 9, 5), new Set())[0]).toMatchObject({ title: 'Algebra II', body: 'Starts at 9:15 am in 204' })
    expect(classAlerts([alg], new Date(2026, 10, 10, 8, 50), new Set())).toHaveLength(0)
    expect(classAlerts([alg], new Date(2026, 10, 10, 9, 30), new Set())).toHaveLength(0)
  })
  it('does not repeat a fired alert', () => {
    expect(classAlerts([alg], new Date(2026, 10, 10, 9, 5), new Set(['class:alg:2026-11-10:09:15']))).toHaveLength(0)
  })
})
