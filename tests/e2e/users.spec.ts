import { expect, test } from '@playwright/test'
import { loginAsHost } from './helpers'

test('shows the active table users and their roles', async ({ page }) => {
  await loginAsHost(page)
  await page.getByRole('link', { name: 'Users' }).first().click()

  await expect(page).toHaveURL('/users')
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  const users = page.getByRole('list', { name: 'Table users' })
  await expect(users.getByRole('listitem')).toHaveCount(2)
  await expect(users.getByRole('listitem').filter({ hasText: 'Test Host' })).toContainText('owner')
  await expect(users.getByRole('listitem').filter({ hasText: 'Test Guest' })).toContainText('member')
})
