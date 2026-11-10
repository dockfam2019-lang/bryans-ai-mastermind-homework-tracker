import { describe, expect, it } from 'vitest'
import { predictDifficulty, rankByHardness } from './difficulty'
import type { Assignment } from './types'

let n = 0
const mk = (over: Partial<Assignment>): Assignment => ({ id: `a${n++}`, createdAt: 0, updatedAt: 0, courseId: 'c', title: 'Worksheet', dueDate: '2026-11-12', type: 'homework', priority: 2, status: 'todo', subtasks: [], tags: [], attachmentIds: [], ...over })

describe('predictDifficulty', () => {
  it('uses your own rating when there is one', () => {
    expect(predictDifficulty(mk({ difficulty: 5 }), [])).toEqual({ score: 5, source: 'rated', reasons: ['You rated this'] })
  })

  it('starts from the kind of work and adds length and title hints', () => {
    expect(predictDifficulty(mk({}), []).score).toBe(2)
    expect(predictDifficulty(mk({ type: 'exam' }), []).score).toBe(4.5)
    const big = predictDifficulty(mk({ type: 'project', title: 'Research paper', estimatedMinutes: 180 }), [])
    expect(big.score).toBe(4.5) // 3.5 + 0.7 + 0.3
    expect(big.reasons.join(' ')).toContain('long task')
  })

  it('learns from estimate vs actual time in the same course', () => {
    const slow = [mk({ status: 'done', estimatedMinutes: 30, actualMinutes: 60 }), mk({ status: 'done', estimatedMinutes: 40, actualMinutes: 60 })]
    expect(predictDifficulty(mk({}), slow).score).toBe(2.5)
    const fast = [mk({ status: 'done', estimatedMinutes: 60, actualMinutes: 30 }), mk({ status: 'done', estimatedMinutes: 60, actualMinutes: 40 })]
    expect(predictDifficulty(mk({}), fast).score).toBe(1.7)
  })

  it('pulls toward your past ratings in the same course', () => {
    const rated = [mk({ status: 'done', difficulty: 5 }), mk({ status: 'done', difficulty: 5 })]
    expect(predictDifficulty(mk({}), rated).score).toBe(3.2) // 0.6 * 2 + 0.4 * 5
  })

  it('stays within 1 to 5', () => {
    expect(predictDifficulty(mk({ type: 'exam', title: 'Final research paper', estimatedMinutes: 300 }), []).score).toBeLessThanOrEqual(5)
  })
})

describe('rankByHardness', () => {
  it('orders hardest first and breaks ties by due date', () => {
    const rows = [mk({ id: 'easy', title: 'Read' }), mk({ id: 'exam', type: 'exam' }), mk({ id: 'sameLater', dueDate: '2026-11-20' }), mk({ id: 'sameSoon', dueDate: '2026-11-11' })]
    expect(rankByHardness(rows, []).map((r) => r.assignment.id)).toEqual(['exam', 'sameSoon', 'easy', 'sameLater']) // the three homework items tie at 2.0, so the earliest due date leads
  })
})
