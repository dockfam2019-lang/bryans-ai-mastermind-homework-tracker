import { describe, expect, it } from 'vitest'
import { cleanExtracted, cleanSteps, CLAUDE_MODEL } from './claude'

describe('Claude result cleaning', () => {
  it('uses the current default model id', () => {
    expect(CLAUDE_MODEL).toBe('claude-opus-5-5')
  })

  it('keeps well-formed items, drops broken ones and clamps values', () => {
    const out = cleanExtracted({ assignments: [
      { title: ' Essay 1 ', course: 'AP Lit', dueDate: '2026-11-18', dueTime: '', type: 'project', estimatedMinutes: 120 },
      { title: 'Quiz', course: '', dueDate: '2026-11-20', dueTime: '14:10', type: 'mystery', estimatedMinutes: 0 },
      { title: '', dueDate: '2026-11-20' },
      { title: 'No date', dueDate: 'next week' },
      { title: 'Huge', dueDate: '2026-12-01', type: 'exam', estimatedMinutes: 99999 },
    ] })
    expect(out).toEqual([
      { title: 'Essay 1', course: 'AP Lit', dueDate: '2026-11-18', dueTime: undefined, type: 'project', estimatedMinutes: 120 },
      { title: 'Quiz', course: undefined, dueDate: '2026-11-20', dueTime: '14:10', type: 'homework', estimatedMinutes: undefined },
      { title: 'Huge', course: undefined, dueDate: '2026-12-01', dueTime: undefined, type: 'exam', estimatedMinutes: undefined },
    ])
  })

  it('handles junk without throwing', () => {
    expect(cleanExtracted(null)).toEqual([])
    expect(cleanExtracted({ assignments: 'no' })).toEqual([])
    expect(cleanSteps({ steps: [{ title: 'Outline', minutes: 20 }, { title: '' }, { title: 'Draft', minutes: -5 }] })).toEqual([{ title: 'Outline', minutes: 20 }, { title: 'Draft', minutes: undefined }])
  })
})
