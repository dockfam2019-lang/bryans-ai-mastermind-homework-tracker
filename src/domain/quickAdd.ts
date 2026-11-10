// Natural-language quick add: "math ch5 problems due fri 9am ~45m".
// Pulls out an estimate, a due date and time, a course and a type; whatever is left is the title.
// Pure and offline. Anything it cannot read is left undefined so the form can ask for it.
import { addDays, fromLocalDate, toLocalDate, weekday } from './dates'
import type { AssignmentType, Course, LocalDate, TimeOfDay } from './types'

export interface QuickAddResult {
  title: string
  courseId?: string
  dueDate?: LocalDate
  dueTime?: TimeOfDay
  estimatedMinutes?: number
  type: AssignmentType
  priority: 1 | 2 | 3
}

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const ALIASES: Record<string, string[]> = {
  math: ['math', 'algebra', 'geometry', 'calculus', 'trig', 'statistics'],
  alg: ['algebra'], calc: ['calculus'], geo: ['geometry'], stats: ['statistics'],
  chem: ['chem'], bio: ['bio'], phys: ['phys'],
  lit: ['lit', 'english'], eng: ['english', 'lit'], english: ['english', 'lit'],
  hist: ['hist'], span: ['span'], cs: ['computer', 'programming'],
}

const pad = (n: number) => String(n).padStart(2, '0')

function parseTime(s: string): TimeOfDay | undefined {
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (m) {
    let h = Number(m[1]) % 12
    if (m[3].toLowerCase() === 'pm') h += 12
    return `${pad(h)}:${pad(Number(m[2] ?? 0))}`
  }
  const m24 = s.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  return m24 ? `${pad(Number(m24[1]))}:${m24[2]}` : undefined
}

const TIME_PART = String.raw`(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|(?:[01]?\d|2[0-3]):[0-5]\d))?`

export function parseQuickAdd(input: string, today: LocalDate, courses: Course[] = []): QuickAddResult {
  let text = ` ${input.trim()} `
  const result: QuickAddResult = { title: '', type: 'homework', priority: 2 }

  // estimate: ~45m, ~1.5h, "45 min"
  const est = text.match(/~\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)?\b/i) ?? text.match(/\b(\d+)\s*(minutes?|mins?)\b/i)
  if (est) {
    const unit = (est[2] ?? 'm').toLowerCase()
    result.estimatedMinutes = Math.round(Number(est[1]) * (unit.startsWith('h') ? 60 : 1))
    text = text.replace(est[0], ' ')
  }

  // due date (+ optional time): "due fri 9am", "by tomorrow", "due 11/18", "due nov 18 3pm"
  const named = text.match(new RegExp(String.raw`\b(?:due|by)\s+(today|tonight|tomorrow|tmrw|sun|mon|tue|wed|thu|fri|sat)[a-z]*` + TIME_PART, 'i'))
  const slash = text.match(new RegExp(String.raw`\b(?:due|by)\s+(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?` + TIME_PART, 'i'))
  const monthName = text.match(new RegExp(String.raw`\b(?:due|by)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?` + TIME_PART, 'i'))

  if (named) {
    const w = named[1].toLowerCase()
    if (w === 'today' || w === 'tonight') result.dueDate = today
    else if (w === 'tomorrow' || w === 'tmrw') result.dueDate = addDays(today, 1)
    else {
      const diff = (DAYS.indexOf(w.slice(0, 3)) - weekday(today) + 7) % 7
      result.dueDate = addDays(today, diff === 0 ? 7 : diff)
    }
    if (named[2]) result.dueTime = parseTime(named[2])
    text = text.replace(named[0], ' ')
  } else if (slash || monthName) {
    const m = (slash ?? monthName)!
    const month = slash ? Number(m[1]) : MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)) + 1
    const day = slash ? Number(m[2]) : Number(m[2])
    const todayYear = fromLocalDate(today).getFullYear()
    let year = slash && m[3] ? Number(m[3]) : todayYear
    if (year < 100) year += 2000
    let candidate = toLocalDate(new Date(year, month - 1, day))
    if (!(slash && m[3]) && candidate < today) candidate = toLocalDate(new Date(year + 1, month - 1, day))
    result.dueDate = candidate
    const timeText = slash ? m[4] : m[3]
    if (timeText) result.dueTime = parseTime(timeText)
    text = text.replace(m[0], ' ')
  }

  // course: first word that names or abbreviates a known course
  const words = text.trim().split(/\s+/).filter(Boolean)
  const courseWord = words.findIndex((w) => {
    const lw = w.toLowerCase().replace(/[^a-z]/g, '')
    return lw.length >= 3 && courses.some((c) => matchesCourse(lw, c))
  })
  if (courseWord >= 0) {
    const lw = words[courseWord].toLowerCase().replace(/[^a-z]/g, '')
    result.courseId = courses.find((c) => matchesCourse(lw, c))?.id
    if (courseWord === 0) words.splice(0, 1)
  }

  const body = words.join(' ')
  if (/\bquiz\b/i.test(body)) result.type = 'quiz'
  else if (/\b(exam|final|midterm|test)\b/i.test(body)) result.type = 'exam'
  else if (/^\s*read\b|\breading\b/i.test(body)) result.type = 'reading'
  else if (/\b(project|essay|report|paper|lab)\b/i.test(body)) result.type = 'project'
  if (result.type === 'quiz' || result.type === 'exam') result.priority = 3

  const title = body.replace(/\s+/g, ' ').trim() || input.trim()
  result.title = title.charAt(0).toUpperCase() + title.slice(1)
  return result
}

function matchesCourse(word: string, course: Course): boolean {
  const name = course.name.toLowerCase()
  if (name.split(/\s+/).some((p) => p.length >= 3 && p.startsWith(word))) return true
  return (ALIASES[word] ?? []).some((a) => name.includes(a))
}
