import { describe, expect, it } from 'vitest'
import { examCards, examStage } from './exams'
import type { Assignment } from './types'

const mk = (id: string, dueDate: string, type: Assignment['type'], status: Assignment['status'] = 'todo'): Assignment => ({
  id, createdAt: 0, updatedAt: 0, courseId: 'c', title: id, dueDate, type, priority: 3, status, subtasks: [], tags: [], attachmentIds: [],
})

describe('exam countdown', () => {
  it('escalates from upcoming to today', () => {
    expect([10, 4, 3, 2, 1, 0].map(examStage)).toEqual(['upcoming', 'upcoming', 'soon', 'soon', 'tomorrow', 'today'])
  })

  it('lists open exams in the window, soonest first, and ignores other types, done and past exams', () => {
    const rows = [
      mk('late', '2026-11-20', 'exam'), mk('soon', '2026-11-13', 'exam'), mk('quiz', '2026-11-11', 'quiz'),
      mk('done', '2026-11-12', 'exam', 'done'), mk('past', '2026-11-09', 'exam'), mk('far', '2026-12-30', 'exam'),
    ]
    const cards = examCards(rows, '2026-11-10')
    expect(cards.map((c) => c.assignment.id)).toEqual(['soon', 'late'])
    expect(cards[0]).toMatchObject({ daysLeft: 3, stage: 'soon' })
  })
})
