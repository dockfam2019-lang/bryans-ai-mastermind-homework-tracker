import { formatHM, formatTime, relativeDay } from '../../domain/dates'
import type { LivePlan } from '../../domain/livePlan'
import type { Assignment } from '../../domain/types'

/** "Sat 8am": the deadline, short. */
function dueLabel(a: Assignment, today: string): string {
  return `${relativeDay(a.dueDate, today)}${a.dueTime ? ` ${formatTime(a.dueTime).replace(' ', '')}` : ''}`
}

/** Names each item that cannot get all its time before it is due, so minutes are never dropped silently. */
export function ShortfallWarning({ shortfalls, assignments, today }: { shortfalls: LivePlan['shortfalls']; assignments: Assignment[]; today: string }) {
  const items = shortfalls.flatMap((s) => {
    const a = assignments.find((x) => x.id === s.assignmentId)
    return a ? [{ a, minutes: s.minutes }] : []
  })
  if (items.length === 0) return null
  return (
    <div className="warn" role="status" style={{ marginBottom: 16 }}>
      <ul className="plain">
        {items.map(({ a, minutes }) => (
          <li key={a.id}><b>{a.title}:</b> {formatHM(minutes)} won’t fit before {dueLabel(a, today)}. Raise today’s time or start now.</li>
        ))}
      </ul>
    </div>
  )
}
