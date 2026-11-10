// Storage contract. The UI only talks to these interfaces, so Dexie/IndexedDB can be swapped
// for SQLite-WASM later without touching feature code.
import type {
  Assignment, Attendance, BlobRecord, Base, Card, ClassNote, Course, Deck, EnergyWindow, FocusSession, GameState,
  GradingScale, Hobby, ID, InboxItem, Log, Milestone, MoodCheckin, Pause, ReadingItem, Review, Settings, StudyBlock,
} from '../domain/types'

export type NewItem<T extends Base> = Omit<T, keyof Base> & Partial<Base>

export interface Store<T extends Base> {
  all(): Promise<T[]>
  get(id: ID): Promise<T | undefined>
  /** Creates or updates. Sets id, createdAt and updatedAt when missing. */
  put(item: NewItem<T>): Promise<T>
  remove(id: ID): Promise<void>
  byIndex(index: string, value: string | number | boolean): Promise<T[]>
  count(): Promise<number>
}

export interface Snapshot {
  version: 1
  exportedAt: number
  tables: Record<string, unknown[]>
}

export interface Repository {
  courses: Store<Course>
  assignments: Store<Assignment>
  milestones: Store<Milestone>
  studyBlocks: Store<StudyBlock>
  inbox: Store<InboxItem>
  gradingScales: Store<GradingScale>
  hobbies: Store<Hobby>
  logs: Store<Log>
  pauses: Store<Pause>
  focusSessions: Store<FocusSession>
  attendance: Store<Attendance>
  classNotes: Store<ClassNote>
  energyWindows: Store<EnergyWindow>
  moods: Store<MoodCheckin>
  readingItems: Store<ReadingItem>
  decks: Store<Deck>
  cards: Store<Card>
  reviews: Store<Review>
  game: Store<GameState>
  settings: Store<Settings>
  blobs: Store<BlobRecord>
  /** All tables except blobs, as plain JSON. */
  exportAll(): Promise<Snapshot>
  /** Replaces every table except blobs with the snapshot contents. */
  importAll(snapshot: Snapshot): Promise<void>
  clearAll(): Promise<void>
}
