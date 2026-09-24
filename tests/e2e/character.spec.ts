import { expect, test } from '@playwright/test'
import { loginAsGuest, loginAsHost } from './helpers'
import { E2E_CAMPAIGN } from './seedData'

test('a player creates, edits, and retires their campaign character sheet', async ({ page, browser }) => {
  await loginAsGuest(page)
  await page.goto(`/campaigns/${E2E_CAMPAIGN.id}`)
  await page.getByRole('button', { name: 'Create character' }).click()

  await page.getByLabel('Character name').fill('Mira Nightshade')
  await page.getByLabel('Pronouns').fill('she/her')
  await page.getByLabel('Campaign-visible notes').fill('A witch traveling through Davokar.')
  await page.getByLabel(/Archetype/).selectOption('Witch')
  await page.getByLabel('Corruption').fill('2')
  await page.getByLabel('Shadow visible').check()
  await page.getByLabel('Abilities').fill('Witchsight and rituals')
  await page.getByRole('button', { name: 'Create character' }).click()

  await expect(page).toHaveURL(new RegExp(`/campaigns/${E2E_CAMPAIGN.id}/characters/[^/]+$`))
  await expect(page.getByRole('heading', { name: 'Mira Nightshade', exact: true })).toBeVisible()
  const details = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Symbaroum details' }) })
  await expect(details).toContainText('Witch')
  await expect(details).toContainText('2')
  await expect(details).toContainText('Yes')

  const characterUrl = page.url()
  await page.getByRole('button', { name: 'Edit character' }).click()
  await page.getByLabel('Corruption').fill('3')
  await page.getByLabel('Campaign-visible notes').fill('A witch who survived the journey into Davokar.')
  await page.getByRole('button', { name: 'Save character' }).click()
  await expect(page.getByText('Character updated.')).toBeVisible()
  await expect(details).toContainText('3')

  await page.getByRole('button', { name: 'Retire character' }).click()
  await page.getByRole('button', { name: 'Yes, retire' }).click()
  await expect(page.getByText('Character retired.')).toBeVisible()
  await expect(page.getByText(/Symbaroum · retired/)).toBeVisible()

  await page.getByRole('button', { name: 'Back to campaign' }).click()
  await expect(page.getByRole('link', { name: /Mira Nightshade/ })).toContainText('retired')

  const hostContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  await loginAsHost(hostPage)
  await hostPage.goto(characterUrl)
  await expect(hostPage.getByRole('heading', { name: 'Mira Nightshade', exact: true })).toBeVisible()
  await expect(hostPage.getByRole('button', { name: 'Edit character' })).toHaveCount(0)
  await hostContext.close()
})
