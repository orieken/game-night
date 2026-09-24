import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { loginAsHost } from './helpers'

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const violations = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
  const summary = violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' '))
  }))

  expect(summary, 'Expected no serious or critical WCAG violations').toEqual([])
}

test('login is keyboard navigable and has no serious accessibility violations', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Let’s play.' })).toBeVisible()
  await expectNoSeriousAccessibilityViolations(page)

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Email')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Password')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused()
})

test('primary authenticated views have no serious accessibility violations', async ({ page }) => {
  await loginAsHost(page)
  const views = [
    { path: '/', heading: 'Make tonight count.' },
    { path: '/game-nights', heading: 'Game nights' },
    { path: '/games', heading: 'Game library' },
    { path: '/campaigns', heading: 'Campaigns' },
    { path: '/characters', heading: 'Characters' },
    { path: '/users', heading: 'Users' },
    { path: '/profile', heading: 'Profile' },
    { path: '/leaderboard', heading: 'Leaderboard' }
  ]

  for (const view of views) {
    await page.goto(view.path)
    await expect(page.getByRole('heading', { name: view.heading })).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page)
  }
})

test('authenticated navigation supports skipping navigation and announces route changes', async ({ page }) => {
  await loginAsHost(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Make tonight count.' })).toBeVisible()

  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  await page.getByRole('link', { name: 'Game nights', exact: true }).first().click()
  await expect(page).toHaveTitle('Game nights · Game Night')
  await expect(page.locator('#main-content')).toBeFocused()
})
