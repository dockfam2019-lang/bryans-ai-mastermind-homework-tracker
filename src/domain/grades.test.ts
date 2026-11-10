import { describe, expect, it } from 'vitest'
import { courseAverage, DEFAULT_SCALE, letterFor, minForLetter, percent, whatDoINeed } from './grades'
import type { Assignment } from './types'

const g = (score?: number, maxScore?: number): Assignment => ({
  id: String(score) + maxScore, createdAt: 0, updatedAt: 0, courseId: 'c', title: 't', dueDate: '2026-11-10', type: 'homework', priority: 2, status: 'done', score, maxScore, subtasks: [], tags: [], attachmentIds: [],
})

describe('grades', () => {
  it('converts scores to percent and handles a zero maximum', () => {
    expect(percent(45, 50)).toBe(90)
    expect(percent(1, 0)).toBeNull()
  })

  it('maps percent to a letter on the default and a custom scale', () => {
    expect([100, 93, 92.9, 85, 79.9, 59.9].map((p) => letterFor(p))).toEqual(['A', 'A', 'A-', 'B', 'C+', 'F'])
    const custom = { ranges: [{ min: 90, letter: 'Excellent' }, { min: 70, letter: 'Good' }, { min: 0, letter: 'Keep going' }] }
    expect([95, 75, 10].map((p) => letterFor(p, custom))).toEqual(['Excellent', 'Good', 'Keep going'])
  })

  it('averages by points over graded assignments only', () => {
    expect(courseAverage([g(9, 10), g(40, 50), g(), g(5, undefined)])).toEqual({ pct: (49 / 60) * 100, graded: 2 })
    expect(courseAverage([g()])).toBeNull()
  })

  it('works out what is needed on the final', () => {
    // 85% so far on 70% of the grade; a final worth 30%; wants 88 overall: (88 - 59.5) / 0.3 = 95
    const r = whatDoINeed(85, 30, 88)
    expect(r.needed).toBeCloseTo(95, 5)
    expect(r.possible).toBe(true)
    // wanting 90 overall would need 101.7% on the final, which is out of reach
    expect(whatDoINeed(85, 30, 90).possible).toBe(false)
  })

  it('says when a target is out of reach and clamps to zero when already secured', () => {
    expect(whatDoINeed(60, 10, 95).possible).toBe(false)
    expect(whatDoINeed(100, 10, 85).needed).toBe(0) // 90 points are already locked in
    expect(whatDoINeed(80, 0, 90).needed).toBeNull()
  })

  it('finds the minimum percent for a letter', () => {
    expect(minForLetter('B', DEFAULT_SCALE)).toBe(83)
    expect(minForLetter('Z')).toBeUndefined()
  })
})
