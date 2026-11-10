// The offline "provider": no network, no key. Finds lines that contain a date and turns each into
// an assignment. Less clever than a model, but private and always available.
import { parseDateLoose } from '../domain/csv'
import { toLocalDate } from '../domain/dates'
import { parseQuickAdd } from '../domain/quickAdd'
import { splitIntoSteps } from '../domain/steps'
import type { Course } from '../domain/types'
import type { AiProvider, ExtractedAssignment, ExtractInput, SuggestedStep } from './types'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_DATE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/i
const SLASH_DATE = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/
const TIME = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i

export function offlineExtract(text: string, today: string, courseNames: string[] = []): ExtractedAssignment[] {
  const courses: Course[] = courseNames.map((name, i) => ({ id: String(i), name, color: '', createdAt: 0, updatedAt: 0, schedule: { kind: 'weekly', meetings: [] } }))
  const out: ExtractedAssignment[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s\-*•\d.)]+(?=\D)/, '').trim()
    if (!line) continue
    let date: string | undefined
    let rest = line
    const m = line.match(MONTH_DATE)
    if (m) {
      const year = m[3] ? Number(m[3]) : Number(today.slice(0, 4))
      date = toLocalDate(new Date(year, MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)), Number(m[2])))
      if (!m[3] && date < today) date = toLocalDate(new Date(year + 1, MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)), Number(m[2])))
      rest = line.replace(m[0], ' ')
    } else {
      const s = line.match(SLASH_DATE)
      if (s) { date = parseDateLoose(s[1], today); rest = line.replace(s[0], ' ') }
    }
    if (!date) continue
    let dueTime: string | undefined
    const t = rest.match(TIME)
    if (t) {
      const h = (Number(t[1]) % 12) + (t[3].toLowerCase() === 'pm' ? 12 : 0)
      dueTime = `${String(h).padStart(2, '0')}:${t[2] ?? '00'}`
      rest = rest.replace(t[0], ' ')
    }
    rest = rest.replace(/\b(due|by|on|at)\b/gi, ' ').replace(/[–—:|,;-]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!rest) continue
    const parsed = parseQuickAdd(rest, today, courses)
    out.push({ title: parsed.title, course: parsed.courseId ? courseNames[Number(parsed.courseId)] : undefined, dueDate: date, dueTime, type: parsed.type, estimatedMinutes: parsed.estimatedMinutes })
  }
  return out
}

export const offlineProvider: AiProvider = {
  name: 'Offline (finds lines with dates)',
  async extractAssignments(input: ExtractInput) {
    if (!input.text) throw new Error('Offline reading needs text. PDFs need the AI option turned on in Settings, or paste the text instead.')
    return offlineExtract(input.text, input.today, input.courseNames)
  },
  async breakIntoSteps({ title, minutes }): Promise<SuggestedStep[]> {
    return splitIntoSteps(title, minutes ?? 45, () => '').map((s) => ({ title: s.title }))
  },
}
