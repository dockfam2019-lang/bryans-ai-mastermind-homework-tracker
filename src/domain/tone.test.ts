import { describe, expect, it } from 'vitest'
import { withTone } from './tone'

describe('withTone', () => {
  it('leaves balanced messages unchanged', () => {
    expect(withTone('due', 'balanced', 'Due in 30 min')).toBe('Due in 30 min')
  })
  it('adds a gentle or strict closing line with tidy punctuation', () => {
    expect(withTone('due', 'gentle', 'Due in 30 min')).toBe('Due in 30 min. You have got this.')
    expect(withTone('due', 'strict', 'Due in 30 min.')).toBe('Due in 30 min. Start now.')
    expect(withTone('digest', 'strict', 'Essay, lab')).toBe('Essay, lab. Plan when you will do each one.')
  })
})
