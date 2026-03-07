// WARNING: This file is for Playwright only.
// Do NOT run with Vitest or npm test.
// Use "npm run test:e2e" or "npx playwright test" for e2e tests.

// Ensure this file is not imported by config
// Playwright tests must not be imported by config files
// No changes needed unless imported elsewhere

import { expect, test } from '@playwright/test'

test.skip('loads ATAK profile templates from template buttons', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Platform').selectOption('ATAK')
  const templateTextarea = page.locator('textarea[readonly]').first()

  await page.getByRole('button', { name: 'Manual Alert', exact: true }).click()
  await expect(templateTextarea).toContainText("type='b-a-o-tbl'")
  await expect(templateTextarea).toContainText("<emergency type='911 Alert'>ODIN-ATAK</emergency>")

  await page.getByRole('button', { name: 'Manual Alert Clear', exact: true }).click()
  await expect(templateTextarea).toContainText("type='b-a-o-can'")
  await expect(templateTextarea).toContainText("<emergency cancel='true'>ODIN-ATAK</emergency>")

  await page.getByRole('button', { name: 'MIL-STD-2525D Drop', exact: true }).click()
  await expect(templateTextarea).toContainText("type='a-u-G'")
  await expect(templateTextarea).toContainText("iconsetpath='COT_MAPPING_2525B/a-u/a-u-G'")
})

test.skip('submit modal defaults to Chat Send with blank XML', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Submit Template' }).click()

  await expect(page.getByLabel('Profile / Category')).toHaveValue('Chat Send')
  await expect(page.getByLabel('CoT XML')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Submit GitHub Issue' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy Submission Payload' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0)
})
