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

test('host creates an RPG event and can change it to a mixed night', async ({ page }) => {
  await loginAsHost(page)
  await page.goto('/game-nights/create')

  const eventDate = new Date(Date.now() + 172_800_000).toISOString().slice(0, 10)
  await page.getByText('Tabletop RPG', { exact: true }).click()
  await expect(page.getByLabel(/Tabletop RPG/)).toBeChecked()
  await page.getByLabel('Event Name').fill('E2E Symbaroum Session')
  await page.getByLabel('Date').fill(eventDate)
  await page.getByLabel('Time').fill('19:00')
  await page.getByRole('button', { name: 'Create Event' }).click()

  const eventLink = page.getByRole('link', { name: /E2E Symbaroum Session/ })
  await expect(eventLink).toContainText('Tabletop RPG')
  await eventLink.click()

  await expect(page.getByText('Campaign planning')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Games for this event' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Edit event' }).click()
  await page.getByText('Mixed night', { exact: true }).click()
  await expect(page.getByLabel(/Mixed night/)).toBeChecked()
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('Game night updated.')).toBeVisible()
  await expect(page.getByText('Mixed night', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Games for this event' })).toBeVisible()
})

test('filters upcoming events and history by event type', async ({ page }) => {
  await loginAsHost(page)
  await page.goto('/game-nights')

  await expect(page.getByRole('link', { name: /Mixed Table Night/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Archived Symbaroum Adventure/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('link', { name: /Archived Symbaroum Adventure/ })).toContainText('Tabletop RPG')
  await expect(page.getByRole('link', { name: /Mixed Table Night/ })).toHaveCount(0)

  await page.getByLabel('Event type').selectOption('board_game')
  await expect(page.getByText('No matching events')).toBeVisible()
  await page.getByRole('button', { name: 'Reset filters' }).click()
  await expect(page.getByRole('link', { name: /Mixed Table Night/ })).toBeVisible()
})
