import { describe, expect, it } from 'vitest'
import { decodeFriendCode, encodeFriendCode, IMPORTERS, mergeSnapshots, newFromShare, readClassShare, toClassShare } from './share'
import type { Assignment, Course } from './types'

const course: Course = { id: 'c', name: 'Algebra II', color: '#fff', teacher: 'Ms. Rivera', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [] } }
const a = (over: Partial<Assignment>): Assignment => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, courseId: 'c', title: 'Quiz', dueDate: '2026-11-12', type: 'quiz', priority: 3, status: 'todo', subtasks: [], tags: [], attachmentIds: [], ...over })

describe('class share', () => {
  it('shares open assignments for the course without scores or progress', () => {
    const share = toClassShare(course, [a({ score: 9, maxScore: 10, progress: 0.5 }), a({ status: 'done' }), a({ courseId: 'other' })])
    expect(share.assignments).toHaveLength(1)
    expect(share.assignments[0]).not.toHaveProperty('score')
    expect(share.assignments[0]).not.toHaveProperty('progress')
    expect(share.course).toMatchObject({ name: 'Algebra II', teacher: 'Ms. Rivera' })
  })

  it('validates files and skips assignments already present', () => {
    const share = readClassShare(JSON.parse(JSON.stringify(toClassShare(course, [a({}), a({ title: 'Lab', dueDate: '2026-11-13' })]))))
    expect(newFromShare(share, [a({ title: 'quiz' })], 'c').map((x) => x.title)).toEqual(['Lab'])
    expect(() => readClassShare({ kind: 'nope' })).toThrow('not a Studyboard class file')
  })
})

describe('friend codes', () => {
  it('round-trips, including non-English names', () => {
    const code = encodeFriendCode({ name: 'Bryan ✓ José', level: 4, xp: 720, badges: 3 })
    expect(code.startsWith('SB1-')).toBe(true)
    expect(decodeFriendCode(code)).toEqual({ name: 'Bryan ✓ José', level: 4, xp: 720, badges: 3 })
  })
  it('rejects codes that are not friend codes or are damaged', () => {
    expect(() => decodeFriendCode('hello')).toThrow('start with SB1-')
    expect(() => decodeFriendCode('SB1-!!!')).toThrow('could not be read')
  })
})

describe('mergeSnapshots', () => {
  it('keeps the newest version of each record and records from both sides', () => {
    const local = { version: 1 as const, exportedAt: 5, tables: { courses: [{ id: '1', updatedAt: 10, name: 'old' }, { id: '2', updatedAt: 1, name: 'local only' }] } }
    const remote = { version: 1 as const, exportedAt: 9, tables: { courses: [{ id: '1', updatedAt: 20, name: 'new' }], hobbies: [{ id: 'h', updatedAt: 3 }] } }
    const m = mergeSnapshots(local, remote)
    expect(m.exportedAt).toBe(9)
    expect(m.tables.courses).toEqual([{ id: '1', updatedAt: 20, name: 'new' }, { id: '2', updatedAt: 1, name: 'local only' }])
    expect(m.tables.hobbies).toHaveLength(1)
  })
})

describe('importer registry', () => {
  it('lists file importers as available and school systems as not yet', () => {
    expect(IMPORTERS.filter((i) => i.available).map((i) => i.id)).toEqual(['csv', 'ics', 'class-share'])
    expect(IMPORTERS.find((i) => i.id === 'canvas')?.available).toBe(false)
  })
})
