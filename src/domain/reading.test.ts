import { describe, expect, it } from 'vitest'
import { readingPace } from './reading'
import type { ReadingItem } from './types'

const item = (over: Partial<ReadingItem>): ReadingItem => ({ id: 'r', createdAt: 0, updatedAt: 0, title: 'Ch 7', totalPages: 120, pagesRead: 20, deadline: '2026-11-18', ...over })

describe('readingPace', () => {
  it('spreads the remaining pages over the days left, today included', () => {
    // Nov 10 to Nov 18 inclusive is 9 days; 100 pages remain
    expect(readingPace(item({}), '2026-11-10')).toEqual({ remaining: 100, daysLeft: 9, perDay: 12, status: 'on-track' })
  })
  it('flags due today and past due, and reports done', () => {
    expect(readingPace(item({ deadline: '2026-11-10' }), '2026-11-10')).toMatchObject({ perDay: 100, status: 'due-today' })
    expect(readingPace(item({ deadline: '2026-11-08' }), '2026-11-10')).toMatchObject({ perDay: 100, status: 'past-due' })
    expect(readingPace(item({ pagesRead: 120 }), '2026-11-10')).toMatchObject({ remaining: 0, perDay: 0, status: 'done' })
    expect(readingPace(item({ pagesRead: 200 }), '2026-11-10').remaining).toBe(0)
  })
})
