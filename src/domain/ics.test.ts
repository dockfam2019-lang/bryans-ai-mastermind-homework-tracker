import { describe, expect, it } from 'vitest'
import { fold, parseIcs, toIcs } from './ics'
import type { Assignment, Course } from './types'

const course: Course = { id: 'c', name: 'Algebra II', color: '#fff', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [] } }
const a = (over: Partial<Assignment>): Assignment => ({ id: 'a1', createdAt: 0, updatedAt: 0, courseId: 'c', title: 'Unit 5 quiz', dueDate: '2026-11-10', type: 'quiz', priority: 3, status: 'todo', subtasks: [], tags: [], attachmentIds: [], ...over })
const now = new Date(Date.UTC(2026, 10, 10, 12, 0, 0))

describe('toIcs', () => {
  it('writes a calendar with timed and all-day events using CRLF line endings', () => {
    const ics = toIcs([a({ dueTime: '14:10', estimatedMinutes: 45 }), a({ id: 'a2', title: 'Essay; draft, 2', dueDate: '2026-11-13' })], [course], now)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART:20261110T141000')
    expect(ics).toContain('DTSTART;VALUE=DATE:20261113')
    expect(ics).toContain('DTEND;VALUE=DATE:20261114')
    expect(ics).toContain('SUMMARY:Algebra II: Essay\\; draft\\, 2')
    expect(ics).toContain('DTSTAMP:20261110T120000Z')
    expect(ics).toContain('UID:a1@studyboard')
  })

  it('folds long lines at 75 characters', () => {
    const long = fold('SUMMARY:' + 'x'.repeat(200))
    expect(long.split('\r\n').every((l) => l.length <= 75)).toBe(true)
    expect(long.split('\r\n').slice(1).every((l) => l.startsWith(' '))).toBe(true)
  })
})

describe('parseIcs', () => {
  it('round-trips what it writes, including escapes and folded lines', () => {
    const original = [a({ dueTime: '14:10', title: 'Essay; draft, 2 ' + 'word '.repeat(30) }), a({ id: 'a2', dueDate: '2026-11-13' })]
    const events = parseIcs(toIcs(original, [course], now))
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ date: '2026-11-10', time: '14:10' })
    expect(events[0].summary).toContain('Essay; draft, 2 word word')
    expect(events[1]).toMatchObject({ date: '2026-11-13', summary: 'Algebra II: Unit 5 quiz' })
    expect(events[1].time).toBeUndefined()
  })

  it('reads events from other calendar apps: UTC times and date parameters', () => {
    const text = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'SUMMARY:Chem exam', 'DTSTART;TZID=America/Denver:20261112T090000', 'END:VEVENT', 'BEGIN:VEVENT', 'SUMMARY:Holiday', 'DTSTART;VALUE=DATE:20261126', 'END:VEVENT', 'BEGIN:VEVENT', 'SUMMARY:No start', 'END:VEVENT', 'END:VCALENDAR'].join('\n')
    const events = parseIcs(text)
    expect(events).toEqual([{ summary: 'Chem exam', date: '2026-11-12', time: '09:00', description: undefined }, { summary: 'Holiday', date: '2026-11-26', description: undefined }])
  })

  it('converts UTC times to local time', () => {
    const utc = new Date(Date.UTC(2026, 10, 12, 18, 30))
    const [e] = parseIcs('BEGIN:VEVENT\nSUMMARY:X\nDTSTART:20261112T183000Z\nEND:VEVENT')
    expect(e.time).toBe(`${String(utc.getHours()).padStart(2, '0')}:${String(utc.getMinutes()).padStart(2, '0')}`)
  })
})
