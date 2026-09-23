import { expect, test } from '@playwright/test'
import { loginAsHost } from './helpers'

const pandemicSummary = {
  bggId: 30549,
  name: 'Pandemic',
  yearPublished: 2008,
  thumbnailUrl: 'https://example.com/pandemic-thumb.jpg',
  minPlayers: 2,
  maxPlayers: 4,
  playingTimeMinutes: 45
}

const pandemicDetails = {
  ...pandemicSummary,
  description: 'Work together to stop four diseases.',
  imageUrl: 'https://example.com/pandemic.jpg',
  categories: ['Medical'],
  mechanics: ['Cooperative Game'],
  complexityWeight: 2.41,
  sourceUrl: 'https://boardgamegeek.com/boardgame/30549'
}

test('imports a BoardGameGeek result and preserves its source metadata', async ({ page }) => {
  await page.route('**/api/bgg/search?q=*', (route) => route.fulfill({ json: [pandemicSummary] }))
  await page.route('**/api/bgg/games/30549', (route) => route.fulfill({ json: pandemicDetails }))
  await loginAsHost(page)
  await page.goto('/games/new')

  await page.getByLabel('Board game title').fill('Pandemic')
  const result = page.getByRole('button', { name: /Pandemic/ })
  await expect(result).toContainText('2008')
  await expect(result).toContainText('2–4 players')
  await result.click()

  await expect(page.getByLabel('Game name')).toHaveValue('Pandemic')
  await expect(page.getByLabel('Duration in minutes')).toHaveValue('45')
  await expect(page.getByLabel('Complexity')).toHaveValue('medium')
  await expect(page.getByRole('link', { name: 'BoardGameGeek', exact: true })).toHaveAttribute('href', pandemicDetails.sourceUrl)

  await page.getByRole('button', { name: 'Add game' }).click()
  await expect(page).toHaveURL(/\/games\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Pandemic' })).toBeVisible()

  await page.getByRole('button', { name: 'Edit game' }).click()
  await expect(page.getByText('Your saved record keeps the original source details.')).toBeVisible()

  await page.goto('/games/new')
  await page.getByLabel('Board game title').fill('Pandemic')
  await page.getByRole('button', { name: /Pandemic/ }).click()
  await expect(page.getByRole('alert')).toContainText("Pandemic is already in this table's library.")
})

test('keeps manual entry available when BoardGameGeek is unavailable', async ({ page }) => {
  await page.route('**/api/bgg/search?q=*', (route) => route.fulfill({
    status: 503,
    json: { error: 'BoardGameGeek search is not configured yet.' }
  }))
  await loginAsHost(page)
  await page.goto('/games/new')

  await page.getByLabel('Board game title').fill('Manual game')
  await expect(page.getByRole('alert')).toContainText('not configured yet')

  await page.getByLabel('Game name').fill('Manual Catalog Fallback')
  await page.getByLabel('Minimum players').fill('2')
  await page.getByLabel('Maximum players').fill('5')
  await page.getByRole('button', { name: 'Add game' }).click()

  await expect(page).toHaveURL(/\/games\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Manual Catalog Fallback' })).toBeVisible()
})
