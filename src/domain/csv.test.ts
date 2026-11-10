import { describe, expect, it } from 'vitest'
import { assignmentsFromCsv, parseCsv, parseDateLoose } from './csv'
import type { Course } from './types'

const c = (id: string, name: string): Course => ({ id, name, color: '#fff', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [] } })
const courses = [c('alg', 'Algebra II'), c('chem', 'Chemistry')]

describe('parseCsv', () => {
  it('handles quotes, commas, doubled quotes, CRLF and blank lines', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\n\n1,2')).toEqual([['a', 'b'], ['x, y', 'say "hi"'], ['1', '2']])
  })
  it('keeps newlines inside quoted fields and strips a byte order mark', () => {
    expect(parseCsv('﻿a,b\n"line1\nline2",z')).toEqual([['a', 'b'], ['line1\nline2', 'z']])
  })
})

describe('parseDateLoose', () => {
  it('reads ISO and US style dates and rolls past month/day into next year', () => {
    expect(parseDateLoose('2026-11-3', '2026-11-10')).toBe('2026-11-03')
    expect(parseDateLoose('11/18', '2026-11-10')).toBe('2026-11-18')
    expect(parseDateLoose('1/5', '2026-11-10')).toBe('2027-01-05')
    expect(parseDateLoose('11/18/26', '2026-11-10')).toBe('2026-11-18')
    expect(parseDateLoose('soon', '2026-11-10')).toBeUndefined()
  })
})

describe('assignmentsFromCsv', () => {
  const csv = 'Title,Course,Due Date,Time,Type,Minutes\nUnit 5 quiz,Algebra II,11/12,14:10,quiz,45\n"Lab report, part 1",chem,2026-11-15,,project,90\nMystery,Art,11/20,,,\n,Algebra II,11/20,,,\nBad date,Algebra II,whenever,,,'
  const r = assignmentsFromCsv(csv, courses, '2026-11-10')

  it('imports valid rows with course matching, types and estimates', () => {
    expect(r.items).toHaveLength(2)
    expect(r.items[0]).toMatchObject({ title: 'Unit 5 quiz', courseId: 'alg', dueDate: '2026-11-12', dueTime: '14:10', type: 'quiz', priority: 3, estimatedMinutes: 45 })
    expect(r.items[1]).toMatchObject({ title: 'Lab report, part 1', courseId: 'chem', type: 'project', estimatedMinutes: 90 })
  })

  it('reports skipped rows with their line numbers and a reason', () => {
    expect(r.skipped.map((s) => s.line)).toEqual([4, 5, 6])
    expect(r.skipped[0].reason).toContain('Art')
    expect(r.skipped[1].reason).toBe('No title.')
    expect(r.skipped[2].reason).toContain('whenever')
  })

  it('needs a title and a due column', () => {
    expect(assignmentsFromCsv('foo,bar\n1,2', courses, '2026-11-10').skipped[0].reason).toContain('title column')
    expect(assignmentsFromCsv('', courses, '2026-11-10')).toEqual({ items: [], skipped: [] })
  })
})
