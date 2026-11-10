import { describe, expect, it } from 'vitest'
import { computeBadges, computeXp, levelFor, weeklyQuests, xpForAssignment, XP, type GameInput } from './game'
import type { Assignment, FocusSession, Log } from './types'

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime()
const a = (over: Partial<Assignment>): Assignment => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, courseId: 'c', title: 't', dueDate: '2026-11-10', type: 'homework', priority: 2, status: 'done', subtasks: [], tags: [], attachmentIds: [], ...over })
const focus = (localDate: string, minutes: number): FocusSession => ({ id: localDate + minutes, createdAt: 0, updatedAt: 0, targetType: 'assignment', targetId: 'x', localDate, startedAt: 0, minutes })
const log = (localDate: string): Log => ({ id: localDate + Math.random(), createdAt: 0, updatedAt: 0, hobbyId: 'h', localDate, at: 0 })
const base: GameInput = { assignments: [], focusSessions: [], logs: [], attendance: [], readingItems: [], bestStreak: 0, today: '2026-11-11', weekStart: 0 }

describe('xp', () => {
  it('rewards finishing early most, never takes XP away, and scores undated finishes kindly', () => {
    expect(xpForAssignment(a({ completedAt: at(2026, 11, 8) }))).toBe(XP.early)
    expect(xpForAssignment(a({ completedAt: at(2026, 11, 10) }))).toBe(XP.onDay)
    expect(xpForAssignment(a({ completedAt: at(2026, 11, 12) }))).toBe(XP.late)
    expect(xpForAssignment(a({}))).toBe(XP.late)
    expect(xpForAssignment(a({ status: 'todo' }))).toBe(0)
  })

  it('adds focus time and check-ins', () => {
    const xp = computeXp({ ...base, assignments: [a({ completedAt: at(2026, 11, 8) })], focusSessions: [focus('2026-11-09', 25), focus('2026-11-09', 5)], logs: [log('2026-11-09'), log('2026-11-10')] })
    expect(xp).toBe(25 + 10 + 2 + 16) // early + 25 min + short session (min 2) + 2 check-ins
  })
})

describe('levels', () => {
  it('starts at level 1 and gets harder', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, floor: 0, next: 100, progress: 0 })
    expect(levelFor(99).level).toBe(1)
    expect(levelFor(100).level).toBe(2)
    expect(levelFor(300).level).toBe(3)
    expect(levelFor(150).progress).toBeCloseTo(0.25, 5) // level 2 spans 100 to 300
  })
})

describe('badges and quests', () => {
  it('tracks badge progress without exceeding the target', () => {
    const badges = computeBadges({ ...base, assignments: [a({ completedAt: at(2026, 11, 8) })], focusSessions: Array.from({ length: 12 }, () => focus('2026-11-09', 25)), bestStreak: 3 })
    const by = Object.fromEntries(badges.map((b) => [b.id, b]))
    expect(by['first-step'].earned).toBe(true)
    expect(by['focus-10']).toMatchObject({ earned: true, progress: 10 })
    expect(by['streak-7']).toMatchObject({ earned: false, progress: 3 })
    expect(by['early-bird'].progress).toBe(1)
  })

  it('counts weekly quest progress only inside the current week', () => {
    // today is Wed Nov 11; the week runs Sun Nov 8 to Sat Nov 14
    const q = weeklyQuests({
      ...base,
      assignments: [a({ dueDate: '2026-11-13', completedAt: at(2026, 11, 9) }), a({ dueDate: '2026-11-13', completedAt: at(2026, 11, 3) }), a({ dueDate: '2026-11-09', completedAt: at(2026, 11, 9) })],
      logs: [log('2026-11-07'), log('2026-11-08'), log('2026-11-10')],
      focusSessions: [focus('2026-11-09', 25), focus('2026-11-01', 25)],
    })
    expect(q.find((x) => x.id === 'early-3')).toMatchObject({ progress: 1, done: false })
    expect(q.find((x) => x.id === 'hobby-5')).toMatchObject({ progress: 2 })
    expect(q.find((x) => x.id === 'focus-3')).toMatchObject({ progress: 1 })
  })
})
