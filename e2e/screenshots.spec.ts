import { openApp, test } from './fixtures'

// Saves README screenshots. Run with: npm run screenshots
test.skip(!process.env.SCREENSHOTS, 'only when SCREENSHOTS=1')

const SHOTS: [string, string][] = [['today', '#/today'], ['school', '#/school'], ['week-plan', '#/week/plan'], ['life', '#/life'], ['insights', '#/insights']]

for (const [name, hash] of SHOTS) {
  test(`screenshot ${name}`, async ({ page }, info) => {
    await openApp(page, hash)
    await page.waitForTimeout(300)
    await page.screenshot({ path: `docs/screenshots/${name}-${info.project.name}.png`, fullPage: info.project.name === 'desktop' })
  })
}
