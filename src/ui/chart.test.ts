import { describe, expect, it } from 'vitest'
import { smoothPath, toPoints } from './chart'

describe('chart helpers', () => {
  it('maps values into the drawing box with padding', () => {
    const pts = toPoints([0, 50, 100], 200, 100, 10)
    expect(pts).toEqual([[0, 90], [100, 50], [200, 10]])
  })

  it('handles a single value and all zeros without NaN', () => {
    expect(toPoints([0], 100, 100, 10)).toEqual([[0, 90]])
    expect(toPoints([0, 0], 100, 100, 10).every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true)
  })

  it('builds a path that starts at the first point and ends at the last', () => {
    const d = smoothPath([[0, 10], [50, 40], [100, 20]])
    expect(d.startsWith('M0.0 10.0')).toBe(true)
    expect(d.endsWith('100.0 20.0')).toBe(true)
    expect(smoothPath([])).toBe('')
  })
})
