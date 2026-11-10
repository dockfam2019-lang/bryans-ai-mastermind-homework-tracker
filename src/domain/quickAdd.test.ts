import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from './quickAdd'
import type { Course } from './types'

const course = (id: string, name: string): Course => ({ id, name, color: '#fff', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [] } })
const courses = [course('alg', 'Algebra II'), course('chem', 'Chemistry'), course('lit', 'AP Lit')]
const today = '2026-11-10' // Tuesday

describe('parseQuickAdd', () => {
  it('reads course, due day and time, and estimate from one sentence', () => {
    const r = parseQuickAdd('math ch5 problems due fri 9am ~45m', today, courses)
    expect(r).toMatchObject({ title: 'Ch5 problems', courseId: 'alg', dueDate: '2026-11-13', dueTime: '09:00', estimatedMinutes: 45, type: 'homework', priority: 2 })
  })

  it('handles tomorrow, today and the same weekday meaning next week', () => {
    expect(parseQuickAdd('read ch 7 due tomorrow', today, courses)).toMatchObject({ dueDate: '2026-11-11', type: 'reading' })
    expect(parseQuickAdd('lab outline due today 5pm', today, courses)).toMatchObject({ dueDate: '2026-11-10', dueTime: '17:00', type: 'project' })
    expect(parseQuickAdd('quiz due tue', today, courses).dueDate).toBe('2026-11-17')
  })

  it('reads hours and plain minutes for the estimate', () => {
    expect(parseQuickAdd('essay due fri ~1.5h', today, courses).estimatedMinutes).toBe(90)
    expect(parseQuickAdd('worksheet 30 min due thu', today, courses).estimatedMinutes).toBe(30)
  })

  it('reads numeric and month-name dates, rolling past dates into next year', () => {
    expect(parseQuickAdd('essay due 11/18', today, courses).dueDate).toBe('2026-11-18')
    expect(parseQuickAdd('essay due nov 20 3:30pm', today, courses)).toMatchObject({ dueDate: '2026-11-20', dueTime: '15:30' })
    expect(parseQuickAdd('essay due 1/5', today, courses).dueDate).toBe('2027-01-05')
    expect(parseQuickAdd('essay due 1/5/2028', today, courses).dueDate).toBe('2028-01-05')
  })

  it('detects quiz and exam types and raises priority', () => {
    expect(parseQuickAdd('chem quiz due fri', today, courses)).toMatchObject({ type: 'quiz', priority: 3, courseId: 'chem' })
    expect(parseQuickAdd('algebra final exam due nov 20', today, courses)).toMatchObject({ type: 'exam', priority: 3 })
  })

  it('matches courses by abbreviation and name prefix', () => {
    expect(parseQuickAdd('lit annotations due fri', today, courses).courseId).toBe('lit')
    expect(parseQuickAdd('chemistry homework', today, courses).courseId).toBe('chem')
  })

  it('leaves unknown fields undefined and keeps the whole text as the title', () => {
    const r = parseQuickAdd('call grandma', today, courses)
    expect(r.title).toBe('Call grandma')
    expect(r.dueDate).toBeUndefined()
    expect(r.courseId).toBeUndefined()
    expect(r.estimatedMinutes).toBeUndefined()
  })

  it('falls back to the input when nothing is left after parsing', () => {
    expect(parseQuickAdd('due fri', today, courses).title).toBe('Due fri')
  })
})
