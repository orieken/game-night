import { expect, test } from '@playwright/test'
import { loginAsHost } from './helpers'

test('creates, edits, and archives a flexible tabletop RPG campaign', async ({ page }) => {
  await loginAsHost(page)
  await page.goto('/campaigns/new')

  await page.getByLabel('Campaign name').fill('The Darkest Star')
  await page.getByLabel('Game system').fill('Symbaroum')
  await page.getByLabel('Variant or edition').fill('Original rules')
  await page.getByLabel('Description').fill('A journey into Davokar.')

  await page.getByRole('button', { name: 'Add link' }).click()
  await page.getByLabel('Label').fill('Campaign notes')
  await page.getByLabel('URL').fill('https://example.com/davokar')

  await page.getByRole('button', { name: 'Add field' }).click()
  await page.getByLabel('Field label').fill('Corruption')
  await page.getByLabel('Field type').selectOption('number')
  await page.getByLabel('Required').check()
  await page.getByRole('button', { name: 'Create campaign' }).click()

  await expect(page).toHaveURL(/\/campaigns\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'The Darkest Star' })).toBeVisible()
  await expect(page.getByText('Symbaroum · Original rules')).toBeVisible()
  await expect(page.getByText('Corruption')).toBeVisible()
  await expect(page.getByRole('link', { name: /Campaign notes/ })).toHaveAttribute('href', 'https://example.com/davokar')

  await page.getByRole('button', { name: 'Edit campaign' }).click()
  await page.getByLabel('Variant or edition').fill('Third printing with family house rules')
  await page.getByLabel('Status').selectOption('on_hold')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Campaign updated.')).toBeVisible()
  await expect(page.getByText('Symbaroum · Third printing with family house rules')).toBeVisible()

  await page.getByRole('button', { name: 'Archive campaign' }).click()
  await page.getByRole('button', { name: 'Yes, archive' }).click()
  await expect(page.getByText('Campaign archived.')).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByLabel('Filter campaigns by status').selectOption('archived')
  await expect(page.getByRole('link', { name: /The Darkest Star/ })).toContainText('archived')
})
