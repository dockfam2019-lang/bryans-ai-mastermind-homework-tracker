import { describe, expect, it } from 'vitest'
import { balanceByDay, balanceNudge } from './balance'
import type { FocusSession, Log } from './types'

const f = (localDate: string, minutes: number, targetType: FocusSession['targetType'] = 'assignment'): FocusSession => ({ id: localDate + minutes + targetType, createdAt: 0, updatedAt: 0, targetType, targetId: 'x', localDate, startedAt: 0, minutes })
const l = (localDate: string, durationMin?: number): Log => ({ id: localDate + durationMin, createdAt: 0, updatedAt: 0, hobbyId: 'h', localDate, at: 0, durationMin })

describe('balanceByDay', () => {
  it('splits school and hobby minutes over the last seven days and ignores older days', () => {
    const days = balanceByDay([f('2026-11-10', 50), f('2026-11-09', 30, 'hobby'), f('2026-11-01', 99)], [l('2026-11-10', 40), l('2026-11-08')], '2026-11-10')
    expect(days).toHaveLength(7)
    expect(days[0].date).toBe('2026-11-04')
    expect(days[6]).toEqual({ date: '2026-11-10', schoolMin: 50, hobbyMin: 40 })
    expect(days[5]).toMatchObject({ hobbyMin: 30 })
    expect(days[4]).toMatchObject({ hobbyMin: 20 }) // check-in without a duration counts as 20
  })
})

describe('balanceNudge', () => {
  const mk = (school: number, hobby: number) => [{ date: '2026-11-10', schoolMin: school, hobbyMin: hobby }]
  it('stays quiet with little data', () => { expect(balanceNudge(mk(20, 10), 0).tone).toBe('quiet') })
  it('notices a week that is almost all school', () => { expect(balanceNudge(mk(400, 10), 0).tone).toBe('school-heavy') })
  it('notices hobbies crowding out due work, but only when something is due', () => {
    expect(balanceNudge(mk(60, 240), 2).tone).toBe('hobby-heavy')
    expect(balanceNudge(mk(60, 240), 0).tone).toBe('balanced')
  })
  it('calls a mix balanced and never scolds', () => {
    const n = balanceNudge(mk(200, 120), 1)
    expect(n).toEqual({ tone: 'balanced', message: 'Nicely balanced this week.' })
  })
})
