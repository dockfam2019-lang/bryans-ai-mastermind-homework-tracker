import { useId } from 'react'
import { relativeDay } from '../../domain/dates'
import type { DayLoad } from '../../domain/load'
import { smoothPath, toPoints } from '../../ui/chart'

const W = 1000
const H = 260

export function PulseChart({ load, today, peak }: { load: DayLoad[]; today: string; peak?: DayLoad }) {
  const gid = useId()
  const pts = toPoints(load.map((d) => d.minutes), W, H, 24)
  const line = smoothPath(pts)
  const peakIndex = peak ? load.findIndex((d) => d.date === peak.date) : -1
  const labelAt = [0, Math.floor(load.length / 2), load.length - 1]
  return (
    <svg className="pulse" viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={peak ? `Workload for the next ${load.length} days, peaking ${relativeDay(peak.date, today)} at ${Math.round(peak.minutes / 6) / 10} hours` : 'Workload chart'}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {line && <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gid})`} />}
      {line && <path d={line} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />}
      {peakIndex >= 0 && peak && peak.minutes > 0 && (
        <g>
          <line x1={pts[peakIndex][0]} x2={pts[peakIndex][0]} y1={pts[peakIndex][1]} y2={H} stroke="var(--text)" strokeOpacity="0.5" strokeDasharray="4 6" />
          <circle cx={pts[peakIndex][0]} cy={pts[peakIndex][1]} r="7" fill="var(--text)" />
          <text x={Math.min(pts[peakIndex][0] + 14, W - 130)} y={Math.max(pts[peakIndex][1] - 8, 16)}>{`PEAK ${relativeDay(peak.date, today).toUpperCase()}`}</text>
        </g>
      )}
      {labelAt.map((i) => (
        <text key={i} x={pts[i]?.[0] ?? 0} y={H + 20} textAnchor={i === 0 ? 'start' : i === load.length - 1 ? 'end' : 'middle'}>
          {relativeDay(load[i].date, today).toUpperCase()}
        </text>
      ))}
    </svg>
  )
}
