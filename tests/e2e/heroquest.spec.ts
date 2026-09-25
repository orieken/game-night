import { expect, test } from '@playwright/test'
import { loginAsGuest, loginAsHost } from './helpers'
import { E2E_GUEST, E2E_HEROQUEST_GAME } from './seedData'

test('creates a HeroQuest campaign and lets an assigned player progress a table-owned hero', async ({ page, browser }) => {
  await loginAsHost(page)
  await page.goto('/campaigns/new')

  await page.getByText('Campaign board game', { exact: true }).click()
  await page.getByRole('button', { name: 'Use HeroQuest preset' }).click()
  await page.getByLabel('Campaign name').fill('The Trial of the Dread Moon')
  await page.getByLabel('Linked library game').selectOption(E2E_HEROQUEST_GAME.id)
  await page.getByRole('group', { name: 'Campaign players' }).getByLabel(E2E_GUEST.displayName).check()
  await page.getByRole('button', { name: 'Create campaign' }).click()

  await expect(page.getByRole('heading', { name: 'The Trial of the Dread Moon' })).toBeVisible()
  await expect(page.getByText('Hero type')).toBeVisible()
  await expect(page.getByRole('link', { name: /HeroQuest/ })).toHaveAttribute('href', `/games/${E2E_HEROQUEST_GAME.id}`)

  await page.getByRole('button', { name: 'Create character' }).click()
  await expect(page.getByRole('radio', { name: /Table-owned hero/ })).toBeChecked()
  await page.getByLabel('Current controller').selectOption({ label: E2E_GUEST.displayName })
  await page.getByLabel('Character name').fill('Borin the Barbarian')
  await page.getByLabel(/Hero type/).fill('Barbarian')
  await page.getByLabel('Current Body Points').fill('8')
  await page.getByLabel('Maximum Body Points').fill('8')
  await page.getByLabel('Maximum Mind Points').fill('2')
  await page.getByLabel('Gold coins').fill('25')
  await page.getByRole('button', { name: 'Create character' }).click()

  await expect(page.getByText(`Table-owned hero · Controlled by ${E2E_GUEST.displayName}`)).toBeVisible()
  const characterUrl = page.url()

  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  await loginAsGuest(guestPage)
  await guestPage.goto(characterUrl)
  await guestPage.getByRole('button', { name: 'Edit character' }).click()
  await expect(guestPage.getByLabel('Current controller')).toBeDisabled()
  await guestPage.getByLabel('Current Body Points').fill('5')
  await guestPage.getByRole('button', { name: 'Save character' }).click()
  await expect(guestPage.getByText('Character updated.')).toBeVisible()
  await expect(guestPage.getByText('Current Body Points').locator('..')).toContainText('5')
  await guestContext.close()
})
