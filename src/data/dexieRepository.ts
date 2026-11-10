import Dexie, { type Table } from 'dexie'
import type { Base } from '../domain/types'
import type { NewItem, Repository, Snapshot, Store } from './repository'

// Index definitions per table. The first key is the primary key.
const SCHEMA = {
  courses: 'id, name',
  assignments: 'id, courseId, dueDate, status',
  milestones: 'id, assignmentId, date',
  studyBlocks: 'id, assignmentId, date, state',
  inbox: 'id, sorted, capturedAt',
  gradingScales: 'id',
  hobbies: 'id, name',
  logs: 'id, hobbyId, localDate, [hobbyId+localDate]',
  pauses: 'id, hobbyId',
  focusSessions: 'id, targetId, localDate',
  attendance: 'id, eventType, courseId, localDate',
  classNotes: 'id, courseId, localDate',
  energyWindows: 'id',
  moods: 'id, localDate',
  readingItems: 'id, deadline',
  decks: 'id',
  cards: 'id, deckId, due',
  reviews: 'id, cardId',
  game: 'id',
  settings: 'id',
  blobs: 'id',
} as const

type TableName = keyof typeof SCHEMA
const EXPORTED = (Object.keys(SCHEMA) as TableName[]).filter((t) => t !== 'blobs')

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`)

class DexieStore<T extends Base> implements Store<T> {
  constructor(private table: Table<T, string>) {}
  all() { return this.table.toArray() }
  get(id: string) { return this.table.get(id) }
  async put(item: NewItem<T>): Promise<T> {
    const now = Date.now()
    const existing = item.id ? await this.table.get(item.id) : undefined
    const record = { ...item, id: item.id ?? newId(), createdAt: existing?.createdAt ?? item.createdAt ?? now, updatedAt: now } as T
    await this.table.put(record)
    return record
  }
  remove(id: string) { return this.table.delete(id) }
  byIndex(index: string, value: string | number | boolean) { return this.table.where(index).equals(value as never).toArray() }
  count() { return this.table.count() }
}

export class StudyboardDB extends Dexie {
  constructor(name = 'studyboard') {
    super(name)
    this.version(1).stores(SCHEMA)
  }
}

export function createDexieRepository(name = 'studyboard'): Repository & { db: StudyboardDB } {
  const db = new StudyboardDB(name)
  // Dexie's overloaded transaction() signature makes tsc recurse too deeply here, so pin the shape we use.
  type Tx = (mode: 'rw', tables: Table[], fn: () => Promise<void>) => Promise<void>
  const inTx = (fn: () => Promise<void>): Promise<void> => (db.transaction as unknown as Tx).call(db, 'rw', db.tables, fn)
  const s = <T extends Base>(t: TableName) => new DexieStore<T>(db.table(t) as Table<T, string>)
  return {
    db,
    courses: s('courses'), assignments: s('assignments'), milestones: s('milestones'), studyBlocks: s('studyBlocks'),
    inbox: s('inbox'), gradingScales: s('gradingScales'), hobbies: s('hobbies'), logs: s('logs'), pauses: s('pauses'),
    focusSessions: s('focusSessions'), attendance: s('attendance'), classNotes: s('classNotes'),
    energyWindows: s('energyWindows'), moods: s('moods'), readingItems: s('readingItems'), decks: s('decks'),
    cards: s('cards'), reviews: s('reviews'), game: s('game'), settings: s('settings'), blobs: s('blobs'),
    async exportAll(): Promise<Snapshot> {
      const tables: Record<string, unknown[]> = {}
      for (const t of EXPORTED) tables[t] = await db.table(t).toArray()
      return { version: 1, exportedAt: Date.now(), tables }
    },
    async importAll(snapshot: Snapshot) {
      if (snapshot.version !== 1) throw new Error(`Unsupported snapshot version ${String(snapshot.version)}`)
      await inTx(async () => {
        for (const t of EXPORTED) {
          const table = db.table(t) as Table<Record<string, unknown>, string>
          await table.clear()
          const rows = snapshot.tables[t] as Record<string, unknown>[] | undefined
          if (Array.isArray(rows) && rows.length) await table.bulkPut(rows)
        }
      })
    },
    async clearAll() {
      const names = Object.keys(SCHEMA) as TableName[]
      await inTx(async () => {
        for (const t of names) await db.table(t).clear()
      })
    },
  }
}
