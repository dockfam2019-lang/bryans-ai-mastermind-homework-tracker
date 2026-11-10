import { useEffect } from 'react'
import { repo } from '../data'
import { classAlerts, dueReminders, type Reminder } from '../domain/reminders'
import { showToast } from './toast'

const KEY = 'studyboard-fired-reminders'

function loadFired(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]) } catch { return new Set() }
}
function saveFired(fired: Set<string>) {
  try { localStorage.setItem(KEY, JSON.stringify([...fired].slice(-200))) } catch { /* storage unavailable */ }
}

function deliver(r: Reminder) {
  // System notification when the user has allowed it; otherwise an in-app toast
  // (Safari and many mobile browsers do not deliver background notifications reliably).
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification(r.title, { body: r.body, icon: '/icon-192.png' }); return } catch { /* fall through */ }
  }
  showToast(`${r.title}: ${r.body}`, { ms: 9000 })
}

/** Checks for due reminders every 30 seconds while the app is open. */
export function useReminders() {
  useEffect(() => {
    const fired = loadFired()
    async function tick() {
      const settings = await repo.settings.get('main')
      if (!settings?.notifications) return
      const now = new Date()
      const [assignments, courses] = await Promise.all([repo.assignments.all(), repo.courses.all()])
      const due = [...dueReminders(assignments, now, fired), ...classAlerts(courses, now, fired, settings.rotationStart)]
      if (due.length === 0) return
      for (const r of due) { fired.add(r.key); deliver(r) }
      saveFired(fired)
    }
    void tick()
    const id = setInterval(() => void tick(), 30000)
    return () => clearInterval(id)
  }, [])
}
