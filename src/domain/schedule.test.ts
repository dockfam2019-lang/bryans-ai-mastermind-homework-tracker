import { describe, expect, it } from 'vitest'
import { classesOn, rotationLetter } from './schedule'
import type { Course } from './types'

const mk = (id: string, kind: Course['schedule']['kind'], meetings: Course['schedule']['meetings']): Course => ({ id, name: id, color: '#fff', createdAt: 0, updatedAt: 0, schedule: { kind, meetings } })

describe('rotationLetter', () => {
  // 2026-11-09 is a Monday and the A day
  it('alternates by school day and skips weekends', () => {
    expect(rotationLetter('2026-11-09', '2026-11-09')).toBe('A')
    expect(rotationLetter('2026-11-10', '2026-11-09')).toBe('B')
    expect(rotationLetter('2026-11-11', '2026-11-09')).toBe('A')
    expect(rotationLetter('2026-11-13', '2026-11-09')).toBe('A') // Fri: 4th school day after start (even)
    expect(rotationLetter('2026-11-16', '2026-11-09')).toBe('B') // next Monday continues the cycle
  })

  it('works for dates before the start', () => {
    expect(rotationLetter('2026-11-06', '2026-11-09')).toBe('B') // previous Friday
    expect(rotationLetter('2026-11-05', '2026-11-09')).toBe('A')
  })
})

describe('classesOn', () => {
  const algebra = mk('Algebra', 'weekly', [{ days: [1, 2, 3, 4, 5], start: '09:15', end: '10:15' }])
  const chem = mk('Chem', 'weekly', [{ days: [2], start: '08:00', end: '09:00' }])
  const art = mk('Art', 'rotating', [{ days: [1, 2, 3, 4, 5], start: '13:00', end: '14:00', rotation: 'A' }])

  it('lists meetings for the weekday sorted by start time', () => {
    expect(classesOn([algebra, chem], '2026-11-10').map((c) => c.course.name)).toEqual(['Chem', 'Algebra'])
    expect(classesOn([algebra, chem], '2026-11-11').map((c) => c.course.name)).toEqual(['Algebra'])
    expect(classesOn([algebra], '2026-11-08')).toEqual([]) // Sunday
  })

  it('shows rotating classes only on their letter day', () => {
    expect(classesOn([art], '2026-11-09', '2026-11-09')).toHaveLength(1)
    expect(classesOn([art], '2026-11-10', '2026-11-09')).toHaveLength(0)
  })

  it('hides rotating classes when no rotation start is set', () => {
    expect(classesOn([art], '2026-11-09')).toHaveLength(0)
  })
})
