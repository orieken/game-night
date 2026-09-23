import { test, expect } from '@playwright/test'
import { loginAsHost } from './helpers'

test('host creates an event, records a result, and sees the leaderboard', async ({ page }) => {
  await loginAsHost(page)
  await page.goto('/game-nights/create')

  const eventDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  await page.getByLabel('Event Name').fill('E2E Game Night')
  await page.getByLabel('Date').fill(eventDate)
  await page.getByLabel('Time').fill('18:00')
  await page.getByLabel('Location').fill('Test HQ')
  await page.getByRole('button', { name: 'Create Event' }).click()

  await expect(page).toHaveURL('/game-nights')
  const eventLink = page.getByRole('link', { name: /E2E Game Night/ })
  await expect(eventLink).toContainText('Test HQ')
  await eventLink.click()

  await page.getByLabel(/Azul/).check()
  await page.getByRole('button', { name: 'Save game choices' }).click()
  await expect(page.getByText('Event games updated.')).toBeVisible()

  await page.getByRole('button', { name: 'Start session' }).click()
  await page.getByLabel('Game', { exact: true }).selectOption('azul')
  await page.getByLabel('Test Host').check()
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByText('Azul session started.')).toBeVisible()

  await page.getByRole('button', { name: 'Enter results' }).click()
  await page.getByLabel('Placement').fill('1')
  await page.getByLabel('Score').fill('42')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page.getByText('Session results saved.')).toBeVisible()

  await page.goto('/leaderboard')
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  const player = page.getByRole('listitem').filter({ hasText: 'Test Host' })
  await expect(player).toContainText('1 completed game')
  await expect(player).toContainText('3')
})
