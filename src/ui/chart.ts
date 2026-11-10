// Smooth curve through points (Catmull-Rom converted to cubic Bezier segments).
export type Pt = [number, number]

export function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return ''
  const f = (n: number) => n.toFixed(1)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/** Map values onto a width x height box, leaving `pad` at the top and bottom. */
export function toPoints(values: number[], width: number, height: number, pad = 20): Pt[] {
  const max = Math.max(1, ...values)
  const n = Math.max(1, values.length - 1)
  return values.map((v, i) => [(i / n) * width, height - pad - (v / max) * (height - pad * 2)])
}
