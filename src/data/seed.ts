// Sample data so the app has something to show on first run. Dates are relative to `today`
// so the demo never looks stale. Users can clear it from Settings.
import { addDays, weekday } from '../domain/dates'
import type { Assignment, Attendance, Hobby, Log, LocalDate, Settings } from '../domain/types'
import type { Repository } from './repository'

export const DEFAULT_SETTINGS: Omit<Settings, 'createdAt' | 'updatedAt'> = {
  id: 'main', theme: 'dark', weekStart: 0, gameEnabled: false, aiEnabled: false, aiTone: 'balanced', notifications: true, seeded: false,
}

export async function ensureSettings(repo: Repository): Promise<Settings> {
  return (await repo.settings.get('main')) ?? (await repo.settings.put(DEFAULT_SETTINGS))
}

// small deterministic generator so seed data is stable between runs
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export async function seedSample(repo: Repository, today: LocalDate): Promise<void> {
  const algebra = await repo.courses.put({ name: 'Algebra II', color: '#6fb4ff', teacher: 'Ms. Rivera', schedule: { kind: 'weekly', meetings: [{ days: [1, 2, 3, 4, 5], start: '09:15', end: '10:15', room: '204' }] }, allowedAbsences: 6 })
  const chem = await repo.courses.put({ name: 'Chemistry', color: '#ffb23e', teacher: 'Mr. Okafor', schedule: { kind: 'weekly', meetings: [{ days: [1, 3, 5], start: '11:00', end: '12:15', room: 'Lab 2' }] }, allowedAbsences: 6 })
  const lit = await repo.courses.put({ name: 'AP Lit', color: '#c79bff', teacher: 'Mrs. Chen', schedule: { kind: 'weekly', meetings: [{ days: [2, 4], start: '13:00', end: '14:00', room: '118' }] }, allowedAbsences: 6 })

  const base = { subtasks: [], tags: [], attachmentIds: [], status: 'todo' as const }
  const items: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { ...base, courseId: algebra.id, title: 'Unit 5 quiz', type: 'quiz', dueDate: today, dueTime: '14:10', priority: 3, estimatedMinutes: 45, difficulty: 4, progress: 0.8 },
    { ...base, courseId: chem.id, title: 'Lab report', type: 'project', dueDate: addDays(today, 3), dueTime: '09:00', priority: 3, estimatedMinutes: 90, difficulty: 3, progress: 0.15 },
    { ...base, courseId: lit.id, title: 'Essay draft 2', type: 'homework', dueDate: addDays(today, 4), dueTime: '08:00', priority: 2, estimatedMinutes: 120, difficulty: 4, progress: 0.4 },
    { ...base, courseId: algebra.id, title: 'Unit 5 exam prep', type: 'exam', dueDate: addDays(today, 4), dueTime: '09:00', priority: 3, estimatedMinutes: 150, difficulty: 5, progress: 0.3 },
    { ...base, courseId: lit.id, title: 'Read chapter 7', type: 'reading', dueDate: addDays(today, 8), priority: 1, estimatedMinutes: 180, difficulty: 2, progress: 0.2 },
    { ...base, courseId: chem.id, title: 'Unit test review', type: 'homework', dueDate: addDays(today, 10), priority: 2, estimatedMinutes: 120, difficulty: 3 },
    { ...base, courseId: algebra.id, title: 'Practice test', type: 'homework', dueDate: addDays(today, -1), priority: 2, estimatedMinutes: 60, status: 'done', completedAt: Date.now() - 86400000 },
  ]
  for (const item of items) await repo.assignments.put(item)
  // a few graded, finished assignments so the Grades screen has something to show
  const graded: [string, string, number, number, number][] = [
    [algebra.id, 'Unit 4 quiz', 41, 50, -9], [algebra.id, 'Homework 4.2', 18, 20, -8], [chem.id, 'Lab 3', 46, 50, -12],
    [chem.id, 'Unit 2 test', 83, 100, -6], [lit.id, 'Essay 1', 88, 100, -14], [lit.id, 'Reading quiz', 9, 10, -4],
  ]
  for (const [courseId, title, score, maxScore, offset] of graded) {
    await repo.assignments.put({ ...base, courseId, title, type: 'homework', dueDate: addDays(today, offset), priority: 2, status: 'done', score, maxScore, progress: 1, completedAt: Date.now() + offset * 86400000 })
  }
  await repo.readingItems.put({ title: 'Great Expectations, chapters 8 to 14', totalPages: 120, pagesRead: 35, deadline: addDays(today, 8), courseId: lit.id })

  // ten school days of devotional attendance, one late
  const att: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>[] = []
  let d = addDays(today, -1)
  while (att.length < 10) {
    const wd = weekday(d)
    if (wd !== 0 && wd !== 6) att.push({ eventType: 'devotional', localDate: d, status: att.length === 4 ? 'late' : 'on-time' })
    d = addDays(d, -1)
  }
  for (const a of att) await repo.attendance.put(a)

  const guitar = await repo.hobbies.put({ name: 'Guitar', icon: 'guitar', color: '#ffb23e', goal: 'Play a full song', cadence: { kind: 'perWeek', times: 4 } } satisfies Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>)
  const rand = rng(7)
  for (let i = 0; i < 70; i++) {
    if (rand() < 0.62) {
      const log: Omit<Log, 'id' | 'createdAt' | 'updatedAt'> = { hobbyId: guitar.id, localDate: addDays(today, -i), at: Date.now() - i * 86400000, durationMin: 15 + Math.round(rand() * 30) }
      await repo.logs.put(log)
    }
  }

  const settings = await ensureSettings(repo)
  await repo.settings.put({ ...settings, seeded: true })
}
