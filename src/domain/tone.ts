// Tone setting for reminders and reviews, from gentle to strict. Strict is direct, never harsh.
export type Tone = 'gentle' | 'balanced' | 'strict'

const ENDINGS: Record<Tone, { due: string; digest: string; review: string }> = {
  gentle: { due: 'You have got this.', digest: 'A little tonight makes tomorrow easier.', review: 'Be kind to yourself.' },
  balanced: { due: '', digest: '', review: '' },
  strict: { due: 'Start now.', digest: 'Plan when you will do each one.', review: 'Set a goal for next week.' },
}

/** Adds a short closing line in the chosen tone. Balanced leaves the message as it is. */
export function withTone(kind: 'due' | 'digest' | 'review', tone: Tone, message: string): string {
  const end = ENDINGS[tone][kind]
  return end ? `${message.replace(/\.?\s*$/, '.')} ${end}` : message
}
