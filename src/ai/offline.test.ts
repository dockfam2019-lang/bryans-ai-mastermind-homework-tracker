import { describe, expect, it } from 'vitest'
import { offlineExtract } from './offline'

describe('offlineExtract', () => {
  const syllabus = [
    'AP Literature, Fall 2026',
    'Week 1: introductions',
    '- Essay 1 due Nov 18',
    '2. Reading quiz: 11/20 at 2:10pm',
    'Final exam — December 15, 2026, 9am',
    'Lab report due Jan 5',
    'Office hours by appointment',
  ].join('\n')

  it('turns lines with a date into assignments and skips the rest', () => {
    const items = offlineExtract(syllabus, '2026-11-10')
    expect(items.map((i) => [i.title, i.dueDate, i.dueTime ?? '', i.type])).toEqual([
      ['Essay 1', '2026-11-18', '', 'project'],
      ['Reading quiz', '2026-11-20', '14:10', 'quiz'],
      ['Final exam', '2026-12-15', '09:00', 'exam'],
      ['Lab report', '2027-01-05', '', 'project'],
    ])
  })

  it('matches course names when a line starts with one', () => {
    const items = offlineExtract('chem lab report due Nov 20', '2026-11-10', ['Algebra II', 'Chemistry'])
    expect(items[0]).toMatchObject({ course: 'Chemistry', title: 'Lab report' })
  })

  it('returns nothing for text without dates', () => {
    expect(offlineExtract('Welcome to class!\nBring a notebook.', '2026-11-10')).toEqual([])
  })
})
