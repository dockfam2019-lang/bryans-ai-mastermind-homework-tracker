// Offline sharing stubs: a class-share file (the offline version of a homework bot), friend codes
// for a private leaderboard, and last-write-wins merging for a future sync server.
import type { Snapshot } from '../data/repository'
import type { Assignment, Base, Course } from './types'

// ---------- class share ----------
export interface ClassShare {
  kind: 'studyboard-class-share'
  version: 1
  course: Pick<Course, 'name' | 'color' | 'teacher' | 'schedule'>
  assignments: Pick<Assignment, 'title' | 'dueDate' | 'dueTime' | 'type' | 'estimatedMinutes' | 'notes'>[]
}

/** Only course details and open assignments travel; scores, notes about you and progress stay home. */
export function toClassShare(course: Course, assignments: Assignment[]): ClassShare {
  return {
    kind: 'studyboard-class-share', version: 1,
    course: { name: course.name, color: course.color, teacher: course.teacher, schedule: course.schedule },
    assignments: assignments.filter((a) => a.courseId === course.id && a.status !== 'done').map((a) => ({ title: a.title, dueDate: a.dueDate, dueTime: a.dueTime, type: a.type, estimatedMinutes: a.estimatedMinutes, notes: a.notes })),
  }
}

export function readClassShare(raw: unknown): ClassShare {
  const s = raw as ClassShare
  if (!s || s.kind !== 'studyboard-class-share' || s.version !== 1 || !s.course?.name || !Array.isArray(s.assignments)) throw new Error('This is not a Studyboard class file.')
  return s
}

/** Shared assignments that are not already in the course (same title and due date). */
export function newFromShare(share: ClassShare, existing: Assignment[], courseId: string): ClassShare['assignments'] {
  const have = new Set(existing.filter((a) => a.courseId === courseId).map((a) => `${a.title.toLowerCase()}|${a.dueDate}`))
  return share.assignments.filter((a) => !have.has(`${a.title.toLowerCase()}|${a.dueDate}`))
}

// ---------- friend codes ----------
export interface FriendCard { name: string; level: number; xp: number; badges: number }
const PREFIX = 'SB1-'

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))

export function encodeFriendCode(f: FriendCard): string {
  return PREFIX + b64url(JSON.stringify([f.name.slice(0, 40), f.level, f.xp, f.badges]))
}

export function decodeFriendCode(code: string): FriendCard {
  const t = code.trim()
  if (!t.startsWith(PREFIX)) throw new Error('Friend codes start with SB1-.')
  try {
    const [name, level, xp, badges] = JSON.parse(fromB64url(t.slice(PREFIX.length))) as [string, number, number, number]
    if (typeof name !== 'string' || ![level, xp, badges].every((n) => Number.isFinite(n) && n >= 0)) throw new Error()
    return { name, level, xp, badges }
  } catch {
    throw new Error('That friend code could not be read.')
  }
}

// ---------- sync (stub) ----------
/** Last write wins per record, by updatedAt. A record missing on one side is kept. Deletions are not tracked yet. */
export function mergeSnapshots(local: Snapshot, remote: Snapshot): Snapshot {
  const tables: Record<string, unknown[]> = {}
  for (const name of new Set([...Object.keys(local.tables), ...Object.keys(remote.tables)])) {
    const byId = new Map<string, Base>()
    for (const r of [...(local.tables[name] ?? []), ...(remote.tables[name] ?? [])] as Base[]) {
      const cur = byId.get(r.id)
      if (!cur || r.updatedAt > cur.updatedAt) byId.set(r.id, r)
    }
    tables[name] = [...byId.values()]
  }
  return { version: 1, exportedAt: Math.max(local.exportedAt, remote.exportedAt), tables }
}

// ---------- importer registry ----------
export interface ImporterInfo { id: string; name: string; available: boolean; note: string }

/** School systems that could plug in later. Only the file-based importers work today. */
export const IMPORTERS: ImporterInfo[] = [
  { id: 'csv', name: 'CSV file', available: true, note: 'Settings, Import assignments (CSV).' },
  { id: 'ics', name: 'Calendar file (.ics)', available: true, note: 'Settings, Import calendar.' },
  { id: 'class-share', name: 'Class share file', available: true, note: 'School, Courses, Import class file.' },
  { id: 'canvas', name: 'Canvas', available: false, note: 'Needs a school-approved connection. Not built yet.' },
  { id: 'google-classroom', name: 'Google Classroom', available: false, note: 'Needs Google sign-in. Not built yet.' },
  { id: 'moodle', name: 'Moodle', available: false, note: 'Needs a school-approved connection. Not built yet.' },
]
