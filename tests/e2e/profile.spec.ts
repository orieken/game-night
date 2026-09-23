import { expect, test } from '@playwright/test'
import { loginAsHost } from './helpers'

test('shows the signed-in user profile and active-table stats', async ({ page }) => {
  await loginAsHost(page)
  await page.getByRole('link', { name: 'View your profile' }).click()

  await expect(page).toHaveURL('/profile')
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Test Host' })).toBeVisible()
  await expect(page.getByText('host@example.com')).toBeVisible()

  const stats = page.getByRole('region', { name: 'Player stats' })
  await expect(stats.getByText('Points')).toBeVisible()
  await expect(stats.getByText('Wins')).toBeVisible()
  await expect(stats.getByText('Games')).toBeVisible()
  await expect(stats.getByText('Win rate')).toBeVisible()
  await expect(stats.getByText('Rank')).toBeVisible()
})
