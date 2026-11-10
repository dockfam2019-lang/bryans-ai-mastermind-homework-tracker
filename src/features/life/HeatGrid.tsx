import { heatLevel, type HeatCell } from '../../domain/hobbies'

/** GitHub-style grid: one column per week, seven rows. Cells after `today` are faded. */
export function HeatGrid({ cells, today, label, columns }: { cells: HeatCell[]; today: string; label: string; columns: number }) {
  const active = cells.filter((c) => c.count > 0).length
  return (
    <div className="heat" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} role="img" aria-label={`${label}: ${active} active days`}>
      {cells.map((c) => (
        <i key={c.date} className={`l${heatLevel(c.minutes)}`} style={c.date > today ? { opacity: 0.3 } : undefined} title={`${c.date}: ${c.count} ${c.count === 1 ? 'session' : 'sessions'}, ${c.minutes} min`} />
      ))}
    </div>
  )
}
