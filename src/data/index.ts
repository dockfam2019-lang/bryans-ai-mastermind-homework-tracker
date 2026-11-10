import { toLocalDate } from '../domain/dates'
import { createDexieRepository } from './dexieRepository'
import { ensureSettings, seedSample } from './seed'

export const repo = createDexieRepository()

/** Makes sure settings exist and loads sample data on the very first run. */
export async function initData(): Promise<void> {
  const settings = await ensureSettings(repo)
  if (!settings.seeded) await seedSample(repo, toLocalDate(new Date()))
}
