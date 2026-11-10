import { describe, expect, it } from 'vitest'
import { splitIntoSteps } from './steps'

let n = 0
const id = () => `id${n++}`

describe('splitIntoSteps', () => {
  it('keeps short tasks as one step', () => {
    expect(splitIntoSteps('Worksheet', 20, id)).toHaveLength(1)
    expect(splitIntoSteps('Worksheet', 20, id)[0].title).toBe('Do it: Worksheet')
  })

  it('splits longer work into roughly 25 minute parts that add up', () => {
    const steps = splitIntoSteps('Lab report', 90, id)
    expect(steps).toHaveLength(4) // 90 / 25 rounds to 4
    const total = steps.map((s) => Number(s.title.match(/about (\d+) min/)![1])).reduce((a, b) => a + b, 0)
    expect(total).toBe(90)
    expect(steps[0].title).toBe('Part 1 of 4 (about 20 min)')
    expect(steps.every((s) => !s.done)).toBe(true)
  })
})
