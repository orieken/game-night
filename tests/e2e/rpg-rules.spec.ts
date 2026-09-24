import { expect, test } from '@playwright/test'
import { loginAsHost } from './helpers'

const fireballSummary = {
  key: 'srd-2024_fireball',
  providerResource: 'spells',
  resourceType: 'spell',
  name: 'Fireball',
  description: 'Level 3 · Evocation',
  edition: '2024',
  editionLabel: '2024 SRD',
  sourceName: 'System Reference Document 5.2'
}

test('searches the approved SRD and opens normalized rule details', async ({ page }) => {
  await page.route('**/api/rules/search?*', (route) => route.fulfill({ json: [fireballSummary] }))
  await page.route('**/api/rules/entries/spells/srd-2024_fireball', (route) => route.fulfill({
    json: {
      ...fireballSummary,
      description: 'A bright streak flashes toward a point in range.',
      facts: [
        { label: 'Level', value: '3' },
        { label: 'School', value: 'Evocation' }
      ],
      sections: [{ title: 'At higher levels', body: 'The damage increases.' }],
      sourceUrl: 'https://www.dndbeyond.com/srd'
    }
  }))
  await loginAsHost(page)
  await page.goto('/rules')

  await expect(page.getByRole('heading', { name: '5e rules library' })).toBeVisible()
  await page.getByLabel('Name or title').fill('fireball')
  await expect(page.getByRole('button', { name: 'View Fireball from the 2024 SRD' })).toBeVisible()
  await page.getByRole('button', { name: 'View Fireball from the 2024 SRD' }).click()

  const entry = page.locator('#rules-entry')
  await expect(entry.getByRole('heading', { name: 'Fireball' })).toBeVisible()
  await expect(entry).toContainText('Evocation')
  await expect(entry).toContainText('The damage increases.')
  await expect(page.getByLabel('Rules content attribution')).toContainText('Creative Commons Attribution 4.0')
})

test('keeps campaigns and characters available when the provider is down', async ({ page }) => {
  await page.route('**/api/rules/search?*', (route) => route.fulfill({
    status: 503,
    json: { error: 'The rules reference is unavailable right now. Campaigns and characters are still available.' }
  }))
  await loginAsHost(page)
  await page.goto('/rules')

  await page.getByLabel('Name or title').fill('goblin')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Rules lookup is temporarily unavailable')
  await expect(alert.getByRole('link', { name: 'Continue to campaigns' })).toHaveAttribute('href', '/campaigns')
  await expect(alert.getByRole('link', { name: 'Continue to characters' })).toHaveAttribute('href', '/characters')
})
