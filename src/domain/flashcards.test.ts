import { describe, expect, it } from 'vitest'
import { dueCards, newCardFields, parseCardLines, reviewCard } from './flashcards'

const today = '2026-11-10'
const fresh = () => newCardFields(today)

describe('reviewCard', () => {
  it('grows the interval with Good answers: 1, 3, then times ease', () => {
    let c = reviewCard(fresh(), 2, today)
    expect(c).toMatchObject({ intervalDays: 1, reps: 1, due: '2026-11-11' })
    c = reviewCard(c, 2, '2026-11-11')
    expect(c).toMatchObject({ intervalDays: 3, reps: 2, due: '2026-11-14' })
    c = reviewCard(c, 2, '2026-11-14')
    expect(c).toMatchObject({ intervalDays: 8, due: '2026-11-22' }) // round(3 * 2.5)
  })

  it('Again resets the card to today and lowers ease, never below 1.3', () => {
    const c = reviewCard({ ...fresh(), intervalDays: 10, reps: 4, ease: 1.4 }, 0, today)
    expect(c).toMatchObject({ intervalDays: 0, reps: 0, due: today, ease: 1.3 })
  })

  it('Easy jumps further and raises ease; Hard grows slowly and lowers it', () => {
    expect(reviewCard(fresh(), 3, today)).toMatchObject({ intervalDays: 2, ease: 2.65 })
    expect(reviewCard({ ...fresh(), intervalDays: 10, reps: 3 }, 1, today)).toMatchObject({ intervalDays: 12, ease: 2.35 })
  })

  it('never schedules past the day before an exam', () => {
    const c = reviewCard({ ...fresh(), intervalDays: 10, reps: 3 }, 2, today, '2026-11-14')
    expect(c.due).toBe('2026-11-13')
    expect(c.intervalDays).toBe(3)
  })

  it('reviews tomorrow when the exam is tomorrow or today has already passed the cap', () => {
    expect(reviewCard({ ...fresh(), intervalDays: 10, reps: 3 }, 2, today, '2026-11-11').due).toBe('2026-11-11')
    expect(reviewCard(fresh(), 2, today, '2026-11-08').due).toBe('2026-11-11') // exam in the past: normal scheduling
  })
})

describe('dueCards and parseCardLines', () => {
  it('returns cards due today or earlier, oldest first', () => {
    const cards = [{ id: 'a', due: '2026-11-12' }, { id: 'b', due: '2026-11-10' }, { id: 'c', due: '2026-11-01' }]
    expect(dueCards(cards, today).map((c) => c.id)).toEqual(['c', 'b'])
  })

  it('reads cards separated by a bar, a tab or a spaced dash and skips the rest', () => {
    const text = 'Mitochondria | powerhouse of the cell\nH2O\twater\nPi - 3.14159\njust a note\n | empty front'
    expect(parseCardLines(text)).toEqual([
      { front: 'Mitochondria', back: 'powerhouse of the cell' },
      { front: 'H2O', back: 'water' },
      { front: 'Pi', back: '3.14159' },
    ])
  })
})
