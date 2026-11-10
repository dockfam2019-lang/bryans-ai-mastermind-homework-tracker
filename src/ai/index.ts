import { offlineProvider } from './offline'
import type { AiProvider } from './types'

const KEY = 'studyboard-anthropic-key'

/** The API key lives in this browser's localStorage only. It is never in backups or exports. */
export function getApiKey(): string {
  try { return localStorage.getItem(KEY) ?? '' } catch { return '' }
}
export function setApiKey(key: string) {
  try { if (key.trim()) localStorage.setItem(KEY, key.trim()); else localStorage.removeItem(KEY) } catch { /* storage unavailable */ }
}

/** Claude when AI is switched on and a key is saved; otherwise the offline helper. The SDK is loaded only on first use. */
export async function getProvider(aiEnabled: boolean): Promise<AiProvider> {
  const key = getApiKey()
  if (!aiEnabled || !key) return offlineProvider
  const { claudeProvider } = await import('./claude')
  return claudeProvider(key)
}

export type { AiProvider } from './types'
