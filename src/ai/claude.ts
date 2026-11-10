// Claude provider. Off by default; runs only when the user turns AI on and supplies their own key.
// Requests go straight from this browser to Anthropic. Only what the user chose to send travels:
// the syllabus text or PDF (or one assignment's title, notes and estimate), today's date and course names.
import Anthropic from '@anthropic-ai/sdk'
import type { AssignmentType } from '../domain/types'
import type { AiProvider, ExtractedAssignment, ExtractInput, SuggestedStep } from './types'

import { CLAUDE_MODEL } from './model'

export { CLAUDE_MODEL }
const TYPES: AssignmentType[] = ['homework', 'quiz', 'exam', 'project', 'reading']

const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['assignments'],
  properties: {
    assignments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'dueDate', 'type', 'course', 'dueTime', 'estimatedMinutes'],
        properties: {
          title: { type: 'string' },
          course: { type: 'string', description: 'One of the given course names, or empty if unclear' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD' },
          dueTime: { type: 'string', description: 'HH:mm in 24 hour time, or empty if none is given' },
          type: { type: 'string', enum: TYPES },
          estimatedMinutes: { type: 'integer', description: 'Your best estimate of minutes of work, or 0 if you cannot tell' },
        },
      },
    },
  },
} as const

const STEPS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['steps'],
  properties: {
    steps: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['title', 'minutes'], properties: { title: { type: 'string' }, minutes: { type: 'integer' } } },
    },
  },
} as const

/** Turns SDK errors into sentences a student can act on. */
export function explainError(e: unknown): Error {
  if (e instanceof Anthropic.AuthenticationError) return new Error('Anthropic did not accept that API key. Check it in Settings.')
  if (e instanceof Anthropic.PermissionDeniedError) return new Error('That API key is not allowed to use this model.')
  if (e instanceof Anthropic.RateLimitError) return new Error('Too many requests right now. Wait a minute and try again.')
  if (e instanceof Anthropic.BadRequestError) return new Error(`Anthropic could not read the request: ${e.message}`)
  if (e instanceof Anthropic.APIConnectionError) return new Error('Could not reach Anthropic. Check your internet connection, or use the offline option.')
  if (e instanceof Anthropic.APIError) return new Error(`Anthropic returned an error (${String(e.status)}). Try again later.`)
  return e instanceof Error ? e : new Error('Something went wrong.')
}

async function askJson<T>(apiKey: string, system: string, content: Anthropic.Beta.BetaContentBlockParam[], schema: Record<string, unknown>): Promise<T> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  let response: Anthropic.Beta.BetaMessage
  try {
    response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
      system,
      messages: [{ role: 'user', content }],
    })
  } catch (e) {
    throw explainError(e)
  }
  if (response.stop_reason === 'refusal') throw new Error('Claude declined this request. Try the offline option instead.')
  if (response.stop_reason === 'max_tokens') throw new Error('The answer was too long. Try a shorter part of the document.')
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
  if (!text) throw new Error('Claude did not return an answer.')
  try {
    return JSON.parse(text.text) as T
  } catch {
    throw new Error('Claude returned something that was not valid JSON.')
  }
}

/** Keeps only well-formed items and clamps values, whatever the model returned. */
export function cleanExtracted(raw: unknown): ExtractedAssignment[] {
  const list = (raw as { assignments?: unknown[] })?.assignments
  if (!Array.isArray(list)) return []
  return list.flatMap((r) => {
    const x = r as Record<string, unknown>
    const title = typeof x.title === 'string' ? x.title.trim() : ''
    const dueDate = typeof x.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.dueDate) ? x.dueDate : ''
    if (!title || !dueDate) return []
    const dueTime = typeof x.dueTime === 'string' && /^\d{2}:\d{2}$/.test(x.dueTime) ? x.dueTime : undefined
    const type = TYPES.includes(x.type as AssignmentType) ? (x.type as AssignmentType) : 'homework'
    const est = Number(x.estimatedMinutes)
    return [{ title: title.slice(0, 200), course: typeof x.course === 'string' && x.course.trim() ? x.course.trim() : undefined, dueDate, dueTime, type, estimatedMinutes: est > 0 && est <= 1200 ? Math.round(est) : undefined }]
  })
}

export function cleanSteps(raw: unknown): SuggestedStep[] {
  const list = (raw as { steps?: unknown[] })?.steps
  if (!Array.isArray(list)) return []
  return list.flatMap((r) => {
    const x = r as Record<string, unknown>
    const title = typeof x.title === 'string' ? x.title.trim() : ''
    const m = Number(x.minutes)
    return title ? [{ title: title.slice(0, 200), minutes: m > 0 && m <= 600 ? Math.round(m) : undefined }] : []
  }).slice(0, 15)
}

export function claudeProvider(apiKey: string): AiProvider {
  return {
    name: 'Claude',
    async extractAssignments(input: ExtractInput) {
      const content: Anthropic.Beta.BetaContentBlockParam[] = []
      if (input.pdfBase64) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 } })
      content.push({
        type: 'text',
        text: [
          `Today is ${input.today}. My courses: ${input.courseNames.join(', ') || 'none yet'}.`,
          'List every assignment, quiz, exam, project and reading with a due date from this syllabus.',
          'Use the year implied by the syllabus; if none, the next occurrence after today. Skip items with no date.',
          input.text ? `\nSyllabus:\n${input.text}` : '',
        ].join('\n'),
      })
      return cleanExtracted(await askJson(apiKey, 'You read school syllabi and extract dated assignments accurately. Never invent items or dates.', content, EXTRACT_SCHEMA))
    },
    async breakIntoSteps({ title, notes, minutes }) {
      const text = `Break this school task into 3 to 8 concrete steps a student can start right away, each with minutes.\nTask: ${title}${notes ? `\nNotes: ${notes}` : ''}${minutes ? `\nTotal time available: about ${minutes} minutes.` : ''}`
      return cleanSteps(await askJson(apiKey, 'You help students plan work in small, concrete steps.', [{ type: 'text', text }], STEPS_SCHEMA))
    },
  }
}
