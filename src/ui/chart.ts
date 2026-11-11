// Monotone cubic curve (Fritsch-Carlson). Unlike a plain spline it never overshoots between points,
// so a day with no work never dips below zero and a peak is drawn where the data peaks.
export type Pt = [number, number]

export function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return ''
  const f = (n: number) => n.toFixed(1)
  if (pts.length === 1) return `M${f(pts[0][0])} ${f(pts[0][1])}`
  const n = pts.length
  const dx: number[] = [], slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0])
    slope.push((pts[i + 1][1] - pts[i][1]) / dx[i])
  }
  // tangents: zero at turning points, harmonic mean elsewhere (keeps the curve monotone)
  const m: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (2 * slope[i - 1] * slope[i]) / (slope[i - 1] + slope[i]))
  m.push(slope[n - 2])
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C ${f(pts[i][0] + h)} ${f(pts[i][1] + m[i] * h)}, ${f(pts[i + 1][0] - h)} ${f(pts[i + 1][1] - m[i + 1] * h)}, ${f(pts[i + 1][0])} ${f(pts[i + 1][1])}`
  }
  return d
}

/** Map values onto a width x height box, leaving `pad` at the top and bottom. */
export function toPoints(values: number[], width: number, height: number, pad = 20): Pt[] {
  const max = Math.max(1, ...values)
  const n = Math.max(1, values.length - 1)
  return values.map((v, i) => [(i / n) * width, height - pad - (v / max) * (height - pad * 2)])
}
