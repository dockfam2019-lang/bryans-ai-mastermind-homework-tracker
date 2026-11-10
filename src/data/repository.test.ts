import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDexieRepository } from './dexieRepository'
import { ensureSettings, seedSample } from './seed'

let n = 0
const fresh = () => createDexieRepository(`test-${n++}`)

describe('dexie repository', () => {
  let repo: ReturnType<typeof fresh>
  beforeEach(() => { repo = fresh() })

  it('creates records with ids and timestamps and updates them in place', async () => {
    const c = await repo.courses.put({ name: 'Algebra II', color: '#fff', schedule: { kind: 'weekly', meetings: [] } })
    expect(c.id).toBeTruthy()
    expect(c.createdAt).toBeLessThanOrEqual(c.updatedAt)
    await new Promise((r) => setTimeout(r, 5))
    const u = await repo.courses.put({ ...c, name: 'Algebra 2' })
    expect(u.id).toBe(c.id)
    expect(u.createdAt).toBe(c.createdAt)
    expect(u.updatedAt).toBeGreaterThan(c.updatedAt)
    expect((await repo.courses.all()).map((x) => x.name)).toEqual(['Algebra 2'])
  })

  it('removes records and queries by index', async () => {
    const a = await repo.hobbies.put({ name: 'Guitar', icon: 'g', color: '#fff', cadence: { kind: 'daily' } })
    await repo.logs.put({ hobbyId: a.id, localDate: '2026-11-10', at: 1 })
    await repo.logs.put({ hobbyId: 'other', localDate: '2026-11-10', at: 2 })
    expect(await repo.logs.byIndex('hobbyId', a.id)).toHaveLength(1)
    await repo.hobbies.remove(a.id)
    expect(await repo.hobbies.get(a.id)).toBeUndefined()
    expect(await repo.logs.count()).toBe(2)
  })

  it('creates default settings once', async () => {
    const a = await ensureSettings(repo)
    const b = await ensureSettings(repo)
    expect(a.id).toBe('main')
    expect(b.createdAt).toBe(a.createdAt)
    expect(await repo.settings.count()).toBe(1)
  })

  it('seeds sample data relative to today', async () => {
    await seedSample(repo, '2026-11-10')
    expect(await repo.courses.count()).toBe(3)
    const open = (await repo.assignments.all()).filter((a) => a.status !== 'done')
    expect(open.some((a) => a.dueDate === '2026-11-10')).toBe(true)
    expect(await repo.attendance.count()).toBe(10)
    expect((await repo.settings.get('main'))?.seeded).toBe(true)
  })

  it('round-trips through export and import, and clears everything', async () => {
    await seedSample(repo, '2026-11-10')
    const snap = await repo.exportAll()
    expect(snap.tables.blobs).toBeUndefined()
    const before = await repo.assignments.count()
    await repo.clearAll()
    expect(await repo.assignments.count()).toBe(0)
    await repo.importAll(snap)
    expect(await repo.assignments.count()).toBe(before)
  })

  it('rejects unknown snapshot versions', async () => {
    await expect(repo.importAll({ version: 2 as never, exportedAt: 0, tables: {} })).rejects.toThrow()
  })
})
