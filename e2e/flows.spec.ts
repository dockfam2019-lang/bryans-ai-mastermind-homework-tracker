import { expect, openApp, test } from './fixtures'

test.describe('school', () => {
  test('edit an assignment: rename, add a step, split into steps, save', async ({ page }) => {
    await openApp(page, '#/school')
    await page.getByRole('button', { name: /^Lab report/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit assignment' })
    await dialog.getByLabel('Title').fill('Lab report final')
    await dialog.getByLabel('New subtask').fill('Graph the data')
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await dialog.getByRole('button', { name: 'Split into steps' }).click()
    await expect(dialog.getByText('Graph the data')).toBeVisible()
    await expect(dialog.getByText(/Part 1 of \d/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: /^Lab report final/ })).toContainText(/steps/)
  })

  test('delete an assignment and bring it back with Undo', async ({ page }) => {
    await openApp(page, '#/school')
    await page.getByRole('button', { name: /^Essay draft 2/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('button', { name: /^Essay draft 2/ })).toHaveCount(0)
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('button', { name: /^Essay draft 2/ })).toBeVisible()
  })

  test('n opens a new assignment from anywhere, / focuses search, t goes to Today', async ({ page }) => {
    await openApp(page, '#/life')
    await page.keyboard.press('n')
    await expect(page.getByRole('dialog', { name: 'New assignment' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.keyboard.press('/')
    await expect(page.getByLabel('Search assignments')).toBeFocused()
    await page.getByLabel('Search assignments').fill('chapter')
    await expect(page.getByRole('button', { name: /^Read chapter 7/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Lab report/ })).toHaveCount(0)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('t')
    await expect(page).toHaveURL(/#\/today$/)
  })

  test('add a course with a rotating schedule, then share it as a file', async ({ page }) => {
    await openApp(page, '#/school/courses')
    await page.getByRole('button', { name: 'Add course' }).click()
    const dialog = page.getByRole('dialog', { name: 'New course' })
    await dialog.getByLabel('Name').fill('Art')
    await dialog.getByLabel('Schedule type').selectOption('rotating')
    await dialog.getByLabel('Rotation').selectOption('A')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(/A days/)).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('listitem').filter({ hasText: 'Art' }).getByRole('button', { name: 'Share' }).click()
    expect((await download).suggestedFilename()).toBe('studyboard-class-art.json')
  })

  test('quick capture goes to the inbox and sorts into an assignment', async ({ page }) => {
    await openApp(page, '#/school')
    await page.getByLabel('Quick add an assignment').fill('chem worksheet due tomorrow')
    await page.getByRole('button', { name: 'Save to inbox' }).click()
    await page.getByRole('link', { name: /Inbox/ }).click()
    await page.getByRole('button', { name: 'Sort' }).click()
    const dialog = page.getByRole('dialog', { name: 'New assignment' })
    await expect(dialog.getByLabel('Title')).toHaveValue('Worksheet')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Your inbox is empty.')).toBeVisible()
  })

  test('the semester wizard creates courses and assignments from scratch', async ({ page }) => {
    await openApp(page, '#/settings')
    await page.getByRole('button', { name: 'Delete all data' }).click()
    await page.getByRole('button', { name: 'Yes, delete everything' }).click()
    await openApp(page, '#/school')
    await page.getByRole('button', { name: 'Set up your semester' }).click()
    const dialog = page.getByRole('dialog', { name: 'Set up your semester' })
    await dialog.getByLabel('Name').first().fill('Biology')
    await dialog.getByRole('button', { name: 'Next' }).click()
    await dialog.getByLabel('Assignments').fill('bio lab due fri 9am ~60m\nbio quiz due nov 20')
    await dialog.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByRole('status')).toContainText('1 course, 2 assignments')
    await expect(page.getByRole('button', { name: /^Lab/ })).toBeVisible()
  })

  test('grades: enter a score and see the average change', async ({ page }) => {
    await openApp(page, '#/school/grades')
    const algebra = page.getByRole('region', { name: 'Algebra II grades' })
    const before = await algebra.locator('.avg').innerText()
    await algebra.getByLabel('Score for Unit 4 quiz').fill('50')
    await algebra.getByLabel('Score for Unit 4 quiz').blur()
    await expect(algebra.locator('.avg')).not.toHaveText(before)
  })

  test('attendance: log devotional late today and see the rate update', async ({ page }) => {
    await openApp(page, '#/school/attendance')
    const card = page.getByRole('region', { name: 'Devotional on time' })
    const before = await card.locator('.stat').innerText()
    await page.getByRole('group', { name: 'Devotional today' }).getByRole('button', { name: 'Late' }).click()
    await expect(card.locator('.stat')).not.toHaveText(before)
  })

  test('reading: add a reading and log pages', async ({ page }) => {
    await openApp(page, '#/school/reading')
    await page.getByRole('button', { name: 'Add reading' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add reading' })
    await dialog.getByLabel('Title').fill('Chapter 9')
    await dialog.getByLabel('Total pages').fill('40')
    await dialog.getByRole('button', { name: 'Save' }).click()
    const row = page.getByRole('listitem').filter({ hasText: 'Chapter 9' })
    await expect(row).toContainText('0 of 40 pages')
    await expect(row.getByLabel('Pages read for Chapter 9')).toHaveValue('5') // 40 pages over 8 days, today included
    await row.getByRole('button', { name: 'Log pages' }).click()
    await expect(row).toContainText('5 of 40 pages')
  })
})

test.describe('week and planning', () => {
  test('one tap on a suggestion plans it, and Undo removes it', async ({ page }) => {
    await openApp(page, '#/week')
    const ghosts = page.locator('.tblock.ghost, .chip.ghost')
    await expect(ghosts.first()).toBeVisible() // suggestions arrive after the data loads; count only once they are there
    await page.waitForTimeout(200)
    const before = await ghosts.count()
    await ghosts.first().click()
    await expect(page.getByRole('status')).toContainText('Planned')
    await expect(page.locator('.tblock.study').first()).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(ghosts).toHaveCount(before)
  })

  test('arrow keys move between weeks and Today comes back', async ({ page }) => {
    await openApp(page, '#/week')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nov 8 – 14')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nov 15 – 21')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nov 1 – 7')
    await page.getByRole('button', { name: 'Today' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nov 8 – 14')
  })

  test('month view shows a day when tapped', async ({ page }) => {
    await openApp(page, '#/week/month')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nov 2026')
    await page.getByRole('button', { name: /^13 Fri Nov/ }).click()
    await expect(page.getByRole('region', { name: /Details for 2026-11-13/ })).toContainText('Lab report')
  })

  test('plan my prep adds exam sessions to the plan', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Plan my prep' }).click()
    await expect(page.getByRole('status')).toContainText('Prep plan added')
    await openApp(page, '#/week/plan')
    await expect(page.locator('.planblock b', { hasText: 'Review notes and flag weak spots' })).toBeVisible()
  })
})

test.describe('life', () => {
  test('add a hobby with weekdays, check in with details, and see its page', async ({ page }) => {
    await openApp(page, '#/life')
    await page.getByRole('button', { name: 'Add hobby' }).click()
    const dialog = page.getByRole('dialog', { name: 'New hobby' })
    await dialog.getByLabel('Name').fill('Running')
    await dialog.getByLabel('How often').selectOption('weekdays')
    await dialog.getByRole('button', { name: 'Save' }).click()
    const card = page.getByRole('article', { name: 'Running' })
    await expect(card).toContainText('Mon Wed Fri')
    await card.getByRole('button', { name: 'Add details' }).click()
    const check = page.getByRole('dialog', { name: 'Check in: Running' })
    await check.getByLabel('Minutes').fill('30')
    await check.getByLabel('Note').fill('First 5k')
    await check.getByLabel('This is a milestone').check()
    await check.getByRole('button', { name: 'Check in' }).click()
    await card.getByRole('link', { name: 'Running' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Running')
    await expect(page.getByRole('region', { name: 'Milestones' })).toContainText('First 5k')
  })

  test('vacation mode pauses and resumes', async ({ page }) => {
    await openApp(page, '#/life')
    await page.getByRole('button', { name: 'Pause everything (vacation)' }).click()
    await expect(page.getByText(/Paused since/)).toBeVisible()
    await page.getByRole('button', { name: 'Resume from vacation' }).click()
    await expect(page.getByText(/Paused since/)).toHaveCount(0)
  })
})

test.describe('insights and settings', () => {
  test('turning on the game layer shows levels, quests and a friend code', async ({ page }) => {
    await openApp(page, '#/settings')
    await page.getByRole('group', { name: /Game layer/ }).getByRole('button', { name: 'On' }).click()
    await openApp(page, '#/insights/game')
    await expect(page.getByRole('region', { name: 'Level' })).toBeVisible()
    await expect(page.getByLabel('Your code')).toHaveValue(/^SB1-/)
    await page.getByLabel('A friend’s code').fill('not a code')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('start with SB1-')
  })

  test('mood check-in is saved', async ({ page }) => {
    await openApp(page, '#/insights')
    await page.getByRole('group', { name: 'Mood' }).getByRole('button', { name: 'Good' }).click()
    await expect(page.getByRole('group', { name: 'Mood' }).getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('light theme sticks after a reload, and so does your data', async ({ page }) => {
    await openApp(page, '#/settings')
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Light' }).click()
    await openApp(page, '#/school')
    await page.getByLabel('Quick add an assignment').fill('lit poem due fri')
    await page.getByLabel('Quick add an assignment').press('Enter')
    await expect(page.getByRole('status')).toContainText('Added')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.getByRole('button', { name: 'Mark Poem done' })).toBeVisible()
  })

  test('back up, delete everything, restore, and the data is back', async ({ page }) => {
    await openApp(page, '#/settings')
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export backup (JSON)' }).click()
    const file = await (await download).path()
    await page.getByRole('button', { name: 'Delete all data' }).click()
    await page.getByRole('button', { name: 'Yes, delete everything' }).click()
    await openApp(page, '#/school')
    await expect(page.getByText('No assignments yet.')).toBeVisible()
    await openApp(page, '#/settings')
    await page.getByLabel('Choose a backup file').setInputFiles(file)
    await page.getByRole('button', { name: 'Replace my data' }).click()
    await expect(page.getByRole('status')).toContainText('Backup restored')
    await openApp(page, '#/school')
    await expect(page.getByRole('button', { name: 'Mark Lab report done' })).toBeVisible()
  })

  test('CSV import previews and adds assignments', async ({ page }) => {
    await openApp(page, '#/settings')
    await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'hw.csv', mimeType: 'text/csv', buffer: Buffer.from('title,course,due\nProblem set 6,Algebra II,11/19\nMystery,Art,11/20\n') })
    const dialog = page.getByRole('dialog', { name: 'Import assignments' })
    await expect(dialog).toContainText('1 ready to import, 1 skipped')
    await dialog.getByRole('button', { name: 'Import 1' }).click()
    await openApp(page, '#/school')
    await expect(page.getByRole('button', { name: 'Mark Problem set 6 done' })).toBeVisible()
  })

  test('calendar export downloads an .ics file', async ({ page }) => {
    await openApp(page, '#/settings')
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export calendar (.ics)' }).click()
    expect((await download).suggestedFilename()).toMatch(/\.ics$/)
  })

  test('AI stays off and the key field only appears when turned on', async ({ page }) => {
    await openApp(page, '#/settings')
    await expect(page.getByLabel('Anthropic API key')).toHaveCount(0)
    await page.getByRole('group', { name: 'AI help (optional)' }).getByRole('button', { name: 'On' }).click()
    await expect(page.getByLabel('Anthropic API key')).toBeVisible()
  })
})

test('names work that will not fit before it is due, on Plan and Today', async ({ page }) => {
  await openApp(page, '#/week/plan')
  await page.getByLabel('Time set aside per day (minutes)').fill('30')
  await expect(page.getByRole('status').filter({ hasText: 'won’t fit before' }).first()).toContainText('Raise today’s time or start now.')
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click()
  await expect(page.getByText('won’t fit before').first()).toBeVisible()
})
