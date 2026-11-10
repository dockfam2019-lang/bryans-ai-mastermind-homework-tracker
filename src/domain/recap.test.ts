import { describe, expect, it } from 'vitest'
import { semesterRecap } from './recap'
import type { GameInput } from './game'
import type { Assignment, Attendance, FocusSession, Hobby, Log } from './types'

const hobby = (id: string, name: string): Hobby => ({ id, name, icon: 'x', color: '#fff', cadence: { kind: 'daily' }, createdAt: 0, updatedAt: 0 })
const log = (hobbyId: string, durationMin: number): Log => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, hobbyId, localDate: '2026-11-10', at: 0, durationMin })
const done = (completedAt: number): Assignment => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, courseId: 'c', title: 't', dueDate: '2026-11-10', type: 'homework', priority: 2, status: 'done', completedAt, subtasks: [], tags: [], attachmentIds: [] })
const focus = (minutes: number): FocusSession => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, targetType: 'assignment', targetId: 'x', localDate: '2026-11-10', startedAt: 0, minutes })
const att = (status: Attendance['status']): Attendance => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, eventType: 'devotional', localDate: '2026-11-10', status })

describe('semesterRecap', () => {
  it('summarizes the term', () => {
    const input: GameInput = {
      assignments: [done(new Date(2026, 10, 8, 12).getTime()), done(new Date(2026, 10, 10, 12).getTime())],
      focusSessions: [focus(60), focus(30)], logs: [log('g', 30), log('g', 30), log('r', 60)], attendance: [att('on-time'), att('late')],
      readingItems: [], bestStreak: 5, today: '2026-11-10', weekStart: 0,
    }
    const r = semesterRecap(input, [hobby('g', 'Guitar'), hobby('r', 'Running')])
    expect(r).toMatchObject({ assignmentsDone: 2, early: 1, focusHours: 1.5, hobbyHours: 2, hobbySessions: 3, bestStreak: 5, onTimePct: 50, topHobby: 'Guitar' })
    expect(r.level).toBeGreaterThanOrEqual(1)
    expect(r.xp).toBeGreaterThan(0)
  })
  it('handles an empty term', () => {
    const r = semesterRecap({ assignments: [], focusSessions: [], logs: [], attendance: [], readingItems: [], bestStreak: 0, today: '2026-11-10', weekStart: 0 }, [])
    expect(r).toMatchObject({ assignmentsDone: 0, onTimePct: null, topHobby: undefined, level: 1, xp: 0, badges: 0 })
  })
})
