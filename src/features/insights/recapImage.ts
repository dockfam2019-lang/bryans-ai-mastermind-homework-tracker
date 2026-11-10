import type { Recap } from '../../domain/recap'

/** Draws the semester recap on a canvas and returns it as a PNG. Fonts are the bundled ones. */
export async function renderRecapPng(r: Recap, title = 'My semester'): Promise<Blob> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const g = canvas.getContext('2d')!
  await document.fonts?.ready

  g.fillStyle = '#07080c'; g.fillRect(0, 0, W, H)
  const blob = (x: number, y: number, rad: number, color: string) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, rad)
    grad.addColorStop(0, color); grad.addColorStop(1, 'rgba(7,8,12,0)')
    g.fillStyle = grad; g.fillRect(0, 0, W, H)
  }
  blob(140, 120, 700, 'rgba(255,122,61,0.45)'); blob(980, 200, 650, 'rgba(61,123,255,0.4)'); blob(560, 1350, 800, 'rgba(23,196,160,0.32)')

  g.fillStyle = '#f3f1ec'
  g.font = '400 110px "Instrument Serif", Georgia, serif'
  g.fillText(title, 80, 200)
  g.fillStyle = '#a7abb7'
  g.font = '500 26px "JetBrains Mono", monospace'
  g.fillText('STUDYBOARD RECAP', 80, 260)

  const stats: [string, string][] = [
    [String(r.assignmentsDone), 'assignments finished'],
    [String(r.focusHours), 'hours of focus'],
    [String(r.hobbySessions), 'hobby sessions'],
    [r.onTimePct === null ? '–' : `${r.onTimePct}%`, 'on time'],
    [String(r.bestStreak), 'best streak'],
    [`Lv ${r.level}`, `${r.xp} XP · ${r.badges} badges`],
  ]
  stats.forEach(([big, label], i) => {
    const x = 80 + (i % 2) * 480
    const y = 420 + Math.floor(i / 2) * 270
    g.fillStyle = 'rgba(255,255,255,0.07)'
    g.beginPath(); g.roundRect(x, y, 440, 230, 28); g.fill()
    g.fillStyle = '#f3f1ec'
    g.font = '700 96px Unbounded, "Manrope Variable", sans-serif'
    g.fillText(big, x + 32, y + 120)
    g.fillStyle = '#a7abb7'
    g.font = '500 28px "Manrope Variable", sans-serif'
    g.fillText(label, x + 32, y + 180)
  })
  if (r.topHobby) {
    g.fillStyle = '#ffb23e'
    g.font = '500 34px "Manrope Variable", sans-serif'
    g.fillText(`Most practiced: ${r.topHobby}`, 80, 1290)
  }
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image'))), 'image/png'))
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
