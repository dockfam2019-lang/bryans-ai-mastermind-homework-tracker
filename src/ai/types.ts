// The AI provider sits behind this interface so it can be swapped. Every result is a preview:
// nothing is saved until the user confirms it.
import type { AssignmentType, LocalDate, TimeOfDay } from '../domain/types'

export interface ExtractedAssignment {
  title: string
  course?: string
  dueDate: LocalDate
  dueTime?: TimeOfDay
  type: AssignmentType
  estimatedMinutes?: number
}

export interface SuggestedStep {
  title: string
  minutes?: number
}

export interface ExtractInput {
  /** Plain text (pasted, or pulled from a .docx or .pptx). */
  text?: string
  /** A PDF as base64, only sent when the user picks a PDF and AI is on. */
  pdfBase64?: string
  today: LocalDate
  courseNames: string[]
}

export interface AiProvider {
  name: string
  extractAssignments(input: ExtractInput): Promise<ExtractedAssignment[]>
  breakIntoSteps(input: { title: string; notes?: string; minutes?: number }): Promise<SuggestedStep[]>
}
