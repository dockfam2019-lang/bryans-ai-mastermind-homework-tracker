import { expect, openApp, test } from './fixtures'

test('Today shows the day at a glance from sample data', async ({ page, errors }) => {
  await openApp(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/due today\./)
  await expect(page.getByRole('region', { name: 'Next up' })).toContainText('Unit 5 quiz')
  await expect(page.getByRole('region', { name: 'Devotional on time' })).toContainText('90%')
  await expect(page.getByRole('region', { name: 'Classes today' })).toContainText('Algebra II')
  expect(errors).toEqual([])
})

test('every main page opens without errors', async ({ page }) => {
  await openApp(page)
  for (const [link, heading] of [['Week', /–/], ['School', 'School'], ['Life', 'Life'], ['Insights', 'Insights']] as const) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  }
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
})

test('quick add understands a sentence and Undo removes it', async ({ page }) => {
  await openApp(page, '#/school')
  const input = page.getByLabel('Quick add an assignment')
  await input.fill('math ch5 problems due fri 9am ~45m')
  await expect(page.locator('.chips')).toContainText('Algebra II')
  await expect(page.locator('.chips')).toContainText('Fri 9 am')
  await input.press('Enter')
  await expect(page.getByRole('status')).toContainText('Added “Ch5 problems”')
  await expect(page.getByRole('button', { name: 'Mark Ch5 problems done' })).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'Mark Ch5 problems done' })).toHaveCount(0)
})

test('marking an assignment done moves it out of the open list', async ({ page }) => {
  await openApp(page, '#/school')
  await page.getByRole('button', { name: 'Mark Read chapter 7 done' }).click()
  await expect(page.getByRole('button', { name: 'Mark Read chapter 7 done' })).toHaveCount(0)
})

test('a hobby check-in counts toward the week', async ({ page }) => {
  await openApp(page, '#/life')
  const card = page.getByRole('article', { name: 'Guitar' })
  const before = await card.locator('.progress .sub').innerText()
  await card.getByRole('button', { name: /Check in|Log another/ }).click()
  await expect(page.getByRole('status')).toContainText('Checked in: Guitar')
  await expect(card.locator('.progress .sub')).not.toHaveText(before)
})

test('start for 5 minutes opens the focus timer', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Start for 5 minutes' }).first().click()
  const dock = page.getByRole('complementary', { name: 'Focus timer' })
  await expect(dock).toContainText('Focus')
  await expect(dock.getByRole('timer')).toHaveText(/^[45]:\d\d$/)
  await dock.getByRole('button', { name: 'Close' }).click()
  await expect(dock).toHaveCount(0)
})

test('the plan shows suggestions that can be accepted, and Week shows the same ones', async ({ page }) => {
  await openApp(page, '#/week/plan')
  const accept = page.getByRole('button', { name: /^Accept / }).first()
  await expect(accept).toBeVisible()
  await accept.click()
  await expect(page.getByRole('button', { name: /^Start / }).first()).toBeVisible()
  await openApp(page, '#/week')
  await expect(page.locator('.ghost').first()).toBeVisible()
})

test('flashcards: make a deck, add cards and study one', async ({ page }) => {
  await openApp(page, '#/school/cards')
  await page.getByRole('button', { name: 'New deck' }).click()
  await page.getByLabel('Name').fill('Unit 5 vocabulary')
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByRole('button', { name: 'Add cards' }).click()
  await page.getByLabel(/One card per line/).fill('Slope | rise over run\nIntercept | where a line crosses an axis')
  await page.getByRole('button', { name: 'Add 2' }).click()
  await page.getByRole('button', { name: 'Study now' }).click()
  await page.getByRole('button', { name: 'Show answer' }).click()
  await page.getByRole('button', { name: 'Good' }).click()
  await expect(page.getByText('1 left today')).toBeVisible()
})

test('the syllabus importer works offline and previews before saving', async ({ page }) => {
  await openApp(page, '#/school')
  await page.getByRole('button', { name: 'Import syllabus' }).click()
  await page.getByLabel('Paste syllabus text').fill('Essay 1 due Nov 18\nQuiz 2: 11/20 at 2:10pm\nOffice hours by appointment')
  await page.getByRole('button', { name: 'Find assignments' }).click()
  await expect(page.getByText('Found 2.')).toBeVisible()
  await page.getByRole('button', { name: 'Add 2' }).click()
  await expect(page.getByRole('status')).toContainText('Added 2 assignments')
})

test('grades: the what-do-I-need calculator answers', async ({ page }) => {
  await openApp(page, '#/school/grades')
  await expect(page.getByRole('region', { name: 'Algebra II grades' }).getByRole('status')).toContainText(/%/)
})

test('a JSON backup downloads', async ({ page }) => {
  await openApp(page, '#/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup (JSON)' }).click()
  expect((await download).suggestedFilename()).toMatch(/^studyboard-backup-\d{4}-\d{2}-\d{2}\.json$/)
})
