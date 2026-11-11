import { describe, expect, it } from 'vitest'
import { remainingMinutes } from './load'
import { capacityFor, chunksFor, lastStudyDay, MIN_BLOCK, plannedMinutes, suggestPlan, type NewBlock } from './scheduler'
import type { Assignment, StudyBlock } from './types'

const mk = (id: string, dueDate: string, estimatedMinutes: number, over: Partial<Assignment> = {}): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, type: 'homework', priority: 2, status: 'todo', estimatedMinutes, subtasks: [], tags: [], attachmentIds: [], ...over,
})
const block = (assignmentId: string, date: string, minutes: number, state: StudyBlock['state']): StudyBlock => ({ id: assignmentId + date, createdAt: 0, updatedAt: 0, assignmentId, date, minutes, state })
const today = '2026-11-10' // Tuesday
const byDay = (blocks: NewBlock[]) => blocks.reduce<Record<string, number>>((m, b) => ({ ...m, [b.date]: (m[b.date] ?? 0) + b.minutes }), {})

describe('capacityFor and chunksFor', () => {
  it('gives weekends three quarters of the weekday time, rounded to 5 minutes', () => {
    expect(capacityFor('2026-11-10')).toBe(120)
    expect(capacityFor('2026-11-14')).toBe(90)
    expect(capacityFor('2026-11-14', 100)).toBe(75)
  })
  it('splits work into even blocks of at least 25 minutes, largest first, and keeps small tasks whole', () => {
    expect(chunksFor(77)).toEqual([42, 35])
    expect(chunksFor(150)).toEqual([50, 50, 50])
    expect(chunksFor(144)).toEqual([54, 45, 45])
    expect(chunksFor(60)).toEqual([60])
    expect(chunksFor(9)).toEqual([9])
    for (const m of [61, 70, 95, 121, 179, 300]) {
      const c = chunksFor(m)
      expect(c.reduce((a, b) => a + b, 0)).toBe(m)
      expect(Math.min(...c)).toBeGreaterThanOrEqual(MIN_BLOCK)
    }
  })
  it('stops the day before a deadline that falls before mid-afternoon', () => {
    expect(lastStudyDay(mk('a', '2026-11-13', 60, { dueTime: '09:00' }))).toBe('2026-11-12')
    expect(lastStudyDay(mk('a', '2026-11-13', 60, { dueTime: '18:00' }))).toBe('2026-11-13')
    expect(lastStudyDay(mk('a', '2026-11-13', 60))).toBe('2026-11-13')
  })
})

describe('suggestPlan', () => {
  it('spreads work in even blocks over the days before it is due', () => {
    const r = suggestPlan({ assignments: [mk('lab', '2026-11-13', 150)], existing: [], today })
    expect(r.blocks.map((b) => [b.date, b.minutes])).toEqual([['2026-11-10', 50], ['2026-11-11', 50], ['2026-11-12', 50]])
    expect(r.shortfalls).toEqual([])
  })

  it('gives the earliest due item first claim on each day', () => {
    const r = suggestPlan({ assignments: [mk('later', '2026-11-12', 60), mk('soon', '2026-11-10', 60)], existing: [], today, perDay: 60 })
    expect(r.blocks[0]).toMatchObject({ assignmentId: 'soon', date: '2026-11-10' })
    expect(r.blocks.find((b) => b.assignmentId === 'later')?.date).toBe('2026-11-11')
  })

  it('reports a shortfall by item when there is not enough time before the due date', () => {
    const r = suggestPlan({ assignments: [mk('big', '2026-11-11', 300)], existing: [], today, perDay: 60 })
    expect(r.blocks.reduce((s, b) => s + b.minutes, 0)).toBe(120)
    expect(r.shortfalls).toEqual([{ assignmentId: 'big', minutes: 180 }])
  })

  it('counts accepted and done blocks as covered work and skips dismissed days', () => {
    const existing = [block('lab', '2026-11-10', 60, 'accepted'), block('lab', '2026-11-11', 40, 'dismissed')]
    const r = suggestPlan({ assignments: [mk('lab', '2026-11-13', 150)], existing, today })
    expect(r.blocks.map((b) => [b.date, b.minutes])).toEqual([['2026-11-12', 45], ['2026-11-13', 45]])
  })

  it('never schedules done or overdue work, and flags overdue items to catch up on', () => {
    const r = suggestPlan({ assignments: [mk('done', '2026-11-12', 60, { status: 'done' }), mk('old', '2026-11-08', 45)], existing: [], today })
    expect(r.blocks).toEqual([])
    expect(r.overdue).toEqual(['old'])
  })

  it('treats something due earlier today as overdue once its time has passed', () => {
    const r = suggestPlan({ assignments: [mk('quiz', '2026-11-10', 45, { dueTime: '09:00' }), mk('tonight', '2026-11-10', 30, { dueTime: '20:00' })], existing: [], today, now: new Date(2026, 10, 10, 12) })
    expect(r.overdue).toEqual(['quiz'])
    expect(r.blocks.map((b) => [b.assignmentId, b.date])).toEqual([['tonight', '2026-11-10']])
  })

  it('never puts a block after the last study day', () => {
    const r = suggestPlan({ assignments: [mk('lab', '2026-11-13', 150, { dueTime: '09:00' })], existing: [], today })
    expect(r.blocks.every((b) => b.date <= '2026-11-12')).toBe(true)
  })

  it('never exceeds the time set aside for a day', () => {
    const r = suggestPlan({ assignments: [mk('a', '2026-11-11', 100), mk('b', '2026-11-11', 100), mk('c', '2026-11-12', 100)], existing: [block('x', '2026-11-10', 30, 'accepted')], today, perDay: 120 })
    for (const [d, m] of Object.entries(byDay(r.blocks))) expect(m + (d === today ? 30 : 0)).toBeLessThanOrEqual(capacityFor(d, 120))
  })

  it('never creates a block under 25 minutes; a leftover merges into the same item’s block', () => {
    // one study day left with room: 100 minutes becomes one 100 minute block, not 50 + 50 on the same day
    const r = suggestPlan({ assignments: [mk('a', '2026-11-11', 100, { dueTime: '09:00' })], existing: [], today })
    expect(r.blocks.map((b) => [b.date, b.minutes])).toEqual([['2026-11-10', 100]])
    // a day with only 20 minutes free is skipped rather than given a 20 minute scrap
    const s = suggestPlan({ assignments: [mk('first', '2026-11-10', 40), mk('second', '2026-11-12', 90)], existing: [], today, perDay: 60 })
    expect(s.blocks.filter((b) => b.assignmentId === 'second').map((b) => b.date)).toEqual(['2026-11-11', '2026-11-12'])
    expect(s.blocks.every((b) => b.minutes >= MIN_BLOCK)).toBe(true)
  })

  it('keeps small tasks whole', () => {
    expect(suggestPlan({ assignments: [mk('tiny', '2026-11-11', 10)], existing: [], today }).blocks.map((b) => b.minutes)).toEqual([10])
  })

  it('marks exam blocks as exam prep and warns about overloaded days', () => {
    const r = suggestPlan({ assignments: [mk('exam', '2026-11-11', 300, { type: 'exam' })], existing: [], today, perDay: 60 })
    expect(r.blocks.every((b) => b.examPrep)).toBe(true)
    expect(r.overloaded[0]).toMatchObject({ date: '2026-11-10', capacity: 60 })
  })

  it('does not plan beyond the horizon', () => {
    const r = suggestPlan({ assignments: [mk('far', '2026-12-30', 60)], existing: [], today, horizonDays: 7 })
    expect(r.blocks.every((b) => b.date <= '2026-11-16')).toBe(true)
  })
})

describe('the sample week (today Wed Nov 11, 2:25 pm; 120 minutes on weekdays, 90 at weekends)', () => {
  // the sample data as it exists in a browser seeded on Tuesday Nov 10
  const seeded = [
    mk('Unit 5 quiz', '2026-11-10', 45, { dueTime: '14:10', type: 'quiz', priority: 3, progress: 0.8 }),
    mk('Lab report', '2026-11-13', 90, { dueTime: '09:00', type: 'project', priority: 3, progress: 0.15 }),
    mk('Essay draft 2', '2026-11-14', 120, { dueTime: '08:00', progress: 0.4 }),
    mk('Unit 5 exam', '2026-11-14', 150, { dueTime: '09:00', type: 'exam', priority: 3, progress: 0.3 }),
    mk('Read chapter 7', '2026-11-18', 180, { type: 'reading', priority: 1, progress: 0.2 }),
    mk('Unit test review', '2026-11-20', 120),
  ]
  const r = suggestPlan({ assignments: seeded, existing: [], today: '2026-11-11', now: new Date(2026, 10, 11, 14, 25), perDay: 120 })

  it('gives every item due this week its full remaining time before its last study day, or a shortfall', () => {
    for (const a of seeded.filter((x) => x.dueDate <= '2026-11-14' && x.id !== 'Unit 5 quiz')) {
      const planned = r.blocks.filter((b) => b.assignmentId === a.id && b.date <= lastStudyDay(a)).reduce((s, b) => s + b.minutes, 0)
      const short = r.shortfalls.find((s) => s.assignmentId === a.id)?.minutes ?? 0
      expect(planned + short, a.id).toBe(remainingMinutes(a))
    }
    expect(r.overdue).toEqual(['Unit 5 quiz'])
  })

  it('stays within each day’s time, has no scraps, and gives later work only leftover time', () => {
    for (const [d, m] of Object.entries(byDay(r.blocks))) expect(m, d).toBeLessThanOrEqual(capacityFor(d, 120))
    expect(r.blocks.every((b) => b.minutes >= MIN_BLOCK)).toBe(true)
    // this week's items fit, so nothing is short; later work starts only once they are covered
    expect(r.shortfalls).toEqual([])
    const later = r.blocks.filter((b) => ['Read chapter 7', 'Unit test review'].includes(b.assignmentId))
    expect(later.every((b) => b.date >= '2026-11-13')).toBe(true)
  })

  it('warns instead of dropping minutes when the week is too full', () => {
    const tight = suggestPlan({ assignments: seeded, existing: [], today: '2026-11-11', now: new Date(2026, 10, 11, 14, 25), perDay: 60 })
    for (const a of seeded.filter((x) => x.dueDate <= '2026-11-14' && x.id !== 'Unit 5 quiz')) {
      const planned = tight.blocks.filter((b) => b.assignmentId === a.id).reduce((s, b) => s + b.minutes, 0)
      const short = tight.shortfalls.find((s) => s.assignmentId === a.id)?.minutes ?? 0
      expect(planned + short, a.id).toBe(remainingMinutes(a))
    }
    expect(tight.shortfalls.length).toBeGreaterThan(0)
    for (const [d, m] of Object.entries(byDay(tight.blocks))) expect(m, d).toBeLessThanOrEqual(capacityFor(d, 60))
  })
})

describe('plannedMinutes', () => {
  it('sums non-dismissed blocks for a day', () => {
    expect(plannedMinutes([block('a', today, 30, 'accepted'), block('b', today, 20, 'suggested'), block('c', today, 99, 'dismissed'), block('d', '2026-11-11', 15, 'accepted')], today)).toBe(50)
  })
})
