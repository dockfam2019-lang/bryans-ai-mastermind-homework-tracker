import AxeBuilder from '@axe-core/playwright'
import { expect, openApp, test } from './fixtures'

// Automated accessibility scan (WCAG 2.1 A and AA rules) on every main screen, in both themes.
const PAGES = ['#/today', '#/week', '#/week/month', '#/week/plan', '#/school', '#/school/courses', '#/school/grades', '#/school/attendance', '#/school/reading', '#/school/cards', '#/life', '#/insights', '#/settings']

for (const theme of ['dark', 'light'] as const) {
  test(`no serious accessibility violations (${theme})`, async ({ page }) => {
    await openApp(page, '#/settings')
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: theme === 'dark' ? 'Dark' : 'Light' }).click()
    for (const hash of PAGES) {
      await openApp(page, hash)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const serious = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${hash}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`), `${hash} in ${theme}`).toEqual([])
    }
  })
}
