import { test as base, expect, type Page } from '@playwright/test'

/** Every test starts on a fixed date with fresh sample data and fails on any console error. */
export const test = base.extend<{ errors: string[] }>({
  // auto: runs for every test, even ones that never ask for `errors`
  errors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.clock.install({ time: new Date(2026, 10, 10, 12, 0, 0) })
    await use(errors)
    expect(errors, 'console errors').toEqual([])
  }, { auto: true }],
})

export async function openApp(page: Page, hash = '#/today') {
  await page.goto(`./${hash}`) // relative, so it also works when the app lives under a sub-path
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
}

export { expect }
