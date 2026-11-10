import { describe, expect, it } from 'vitest'
import { monthGrid, sameMonth, shiftMonth } from './calendar'

describe('monthGrid', () => {
  it('covers November 2026 in five Sunday-start weeks', () => {
    const g = monthGrid('2026-11-10', 0)
    expect(g).toHaveLength(5)
    expect(g[0][0]).toBe('2026-11-01')
    expect(g[4][6]).toBe('2026-12-05')
    expect(g.every((w) => w.length === 7)).toBe(true)
  })

  it('uses six Monday-start weeks when the month needs them', () => {
    const g = monthGrid('2026-11-10', 1)
    expect(g).toHaveLength(6)
    expect(g[0][0]).toBe('2026-10-26')
    expect(g[5][0]).toBe('2026-11-30')
  })

  it('handles leap-year February', () => {
    const g = monthGrid('2028-02-15', 0)
    expect(g.flat()).toContain('2028-02-29')
    expect(g[0][0]).toBe('2028-01-30')
  })

  it('shifts months across year boundaries and compares months', () => {
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-01')
    expect(shiftMonth('2026-01-31', -1)).toBe('2025-12-01')
    expect(sameMonth('2026-11-01', '2026-11-30')).toBe(true)
    expect(sameMonth('2026-11-30', '2026-12-01')).toBe(false)
  })
})
