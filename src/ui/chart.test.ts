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

  it('never overshoots: control points stay within the neighbouring values', () => {
    const pts: [number, number][] = [[0, 100], [10, 0], [20, 100], [30, 100], [40, 0]]
    const ys = [...smoothPath(pts).matchAll(/C ([\d.]+) ([\d.-]+), ([\d.]+) ([\d.-]+)/g)].flatMap((m) => [Number(m[2]), Number(m[4])])
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(100)
  })

  it('draws a flat run as a flat line', () => {
    expect(smoothPath([[0, 50], [10, 50], [20, 50]])).toBe('M0.0 50.0 C 3.3 50.0, 6.7 50.0, 10.0 50.0 C 13.3 50.0, 16.7 50.0, 20.0 50.0')
  })
})

