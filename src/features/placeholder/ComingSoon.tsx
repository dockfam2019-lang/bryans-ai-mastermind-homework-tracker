// Teaching empty states for pages that arrive in later phases. Each says what the page will do.
const PAGES: Record<string, { title: string; blurb: string; phase: string; items: string[] }> = {
  week: {
    title: 'Week',
    blurb: 'Your week at a glance: classes, due dates and study blocks, with a warning before a crunch.',
    phase: 'Phase 2 and 4',
    items: ['Week and Month calendars', 'Study blocks you can accept, move or dismiss', 'A load bar per day'],
  },
  school: {
    title: 'School',
    blurb: 'Courses, assignments, grades and attendance in one place.',
    phase: 'Phase 2 and 4',
    items: ['Add assignments with a sentence like "math ch5 problems due fri 9am ~45m"', 'Grades with custom scales', 'Attendance, including devotional on-time tracking'],
  },
  life: {
    title: 'Life',
    blurb: 'Hobbies and habits with streaks that forgive a missed day.',
    phase: 'Phase 3',
    items: ['One-tap check-ins', 'Heatmap per hobby', 'Pause and streak freezes'],
  },
  insights: {
    title: 'Insights',
    blurb: 'Where your time goes and when you do your best work.',
    phase: 'Phase 5',
    items: ['Workload heatmap and pulse chart', 'School vs hobby balance', 'Weekly review'],
  },
}

export function ComingSoon({ id }: { id: string }) {
  const page = PAGES[id]
  return (
    <>
      <div className="pagehead">
        <p className="mono">{page.phase}</p>
        <h1>{page.title}</h1>
        <p>{page.blurb}</p>
      </div>
      <div className="empty">
        <span className="badge">Not built yet</span>
        <p>This page is on the roadmap. It will include:</p>
        <ul>{page.items.map((i) => <li key={i}>{i}</li>)}</ul>
        <a className="btn ghost" href="#/today" style={{ textDecoration: 'none' }}>Back to Today</a>
      </div>
    </>
  )
}
