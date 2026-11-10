// Data model for Studyboard. See docs/SPEC.md.
// Dates are local YYYY-MM-DD strings; timestamps are epoch milliseconds.
// Streaks and daily completions never derive from UTC timestamps.

export type ID = string
export type LocalDate = string // YYYY-MM-DD in the user's local time
export type TimeOfDay = string // HH:mm, 24 hour

export interface Base {
  id: ID
  createdAt: number
  updatedAt: number
}

export interface Meeting {
  days: number[] // 0 = Sunday
  start: TimeOfDay
  end: TimeOfDay
  room?: string
  rotation?: 'A' | 'B' | 'both'
}

export interface Schedule {
  kind: 'weekly' | 'block' | 'rotating'
  meetings: Meeting[]
}

export interface Course extends Base {
  name: string
  color: string
  teacher?: string
  schedule: Schedule
  allowedAbsences?: number
  gradingScaleId?: ID
}

export type AssignmentType = 'homework' | 'quiz' | 'exam' | 'project' | 'reading'
export type AssignmentStatus = 'todo' | 'doing' | 'done'

export interface Subtask {
  id: ID
  title: string
  done: boolean
}

export interface Assignment extends Base {
  courseId: ID
  title: string
  dueDate: LocalDate
  dueTime?: TimeOfDay
  type: AssignmentType
  priority: 1 | 2 | 3
  estimatedMinutes?: number
  actualMinutes?: number
  difficulty?: 1 | 2 | 3 | 4 | 5
  status: AssignmentStatus
  progress?: number // 0 to 1, used when there are no subtasks
  notes?: string
  subtasks: Subtask[]
  tags: string[]
  score?: number
  maxScore?: number
  attachmentIds: ID[]
  completedAt?: number
}

export interface Milestone extends Base {
  assignmentId: ID
  title: string
  date: LocalDate
  done?: boolean
}

export interface StudyBlock extends Base {
  assignmentId: ID
  date: LocalDate
  start?: TimeOfDay
  minutes: number
  state: 'suggested' | 'accepted' | 'dismissed' | 'done'
  examPrep?: boolean
  label?: string
}

export interface InboxItem extends Base {
  text: string
  capturedAt: number
  sorted: boolean
}

export interface GradingScale extends Base {
  name: string
  ranges: { min: number; letter: string }[]
}

export type Cadence =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] }
  | { kind: 'perWeek'; times: number }
  | { kind: 'minutesPerWeek'; minutes: number }

export interface Hobby extends Base {
  name: string
  icon: string
  color: string
  goal?: string
  cadence: Cadence
  archived?: boolean
}

export interface Log extends Base {
  hobbyId: ID
  localDate: LocalDate
  at: number
  durationMin?: number
  note?: string
  photoId?: ID
  metric?: { label: string; value: number }
  /** A moment worth remembering, such as finishing a first song. */
  milestone?: boolean
}

export interface Pause extends Base {
  hobbyId: ID | '*'
  kind: 'freeze' | 'pause'
  start: LocalDate
  end?: LocalDate
}

export interface FocusSession extends Base {
  targetType: 'assignment' | 'hobby' | 'course'
  targetId: ID
  localDate: LocalDate
  startedAt: number
  minutes: number
}

export interface Attendance extends Base {
  eventType: 'class' | 'devotional' | 'school'
  courseId?: ID
  localDate: LocalDate
  status: 'on-time' | 'late' | 'absent'
}

export interface ClassNote extends Base {
  courseId: ID
  localDate: LocalDate
  text: string
}

export interface EnergyWindow extends Base {
  startHour: number
  endHour: number
  rating: 'best' | 'ok' | 'worst'
}

export interface MoodCheckin extends Base {
  localDate: LocalDate
  mood: 1 | 2 | 3 | 4 | 5
  note?: string
}

export interface ReadingItem extends Base {
  title: string
  totalPages: number
  pagesRead: number
  deadline: LocalDate
  courseId?: ID
}

export interface Deck extends Base {
  name: string
  courseId?: ID
  examId?: ID
}

export interface Card extends Base {
  deckId: ID
  front: string
  back: string
  due: LocalDate
  intervalDays: number
  ease: number
  reps: number
}

export interface Review extends Base {
  cardId: ID
  localDate: LocalDate
  grade: 0 | 1 | 2 | 3
}

export interface GameState extends Base {
  xp: number
  level: number
  badges: string[]
  quests: { id: string; title: string; target: number; progress: number; weekOf: LocalDate }[]
}

export type ThemeSetting = 'dark' | 'light' | 'system'

export interface Settings extends Base {
  theme: ThemeSetting
  weekStart: 0 | 1
  gameEnabled: boolean
  aiEnabled: boolean
  aiTone: 'gentle' | 'balanced' | 'strict'
  notifications: boolean
  /** An "A" day, used to place A/B rotating classes. */
  rotationStart?: LocalDate
  /** Minutes per day set aside for study blocks. Default 120. */
  studyMinutesPerDay?: number
  seeded: boolean
}

export interface BlobRecord extends Base {
  name: string
  type: string
  blob: Blob
}
