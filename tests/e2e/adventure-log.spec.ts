import { expect, test } from '@playwright/test'
import { loginAsGuest, loginAsHost } from './helpers'
import { E2E_CAMPAIGN, E2E_CHARACTER, E2E_GUEST, E2E_RSVP_EVENTS, E2E_USER } from './seedData'

test('a campaign manager records and edits an adventure that players can read', async ({ page, browser }) => {
  await loginAsHost(page)
  await page.goto(`/campaigns/${E2E_CAMPAIGN.id}`)
  await page.getByRole('button', { name: 'Record adventure' }).click()

  await page.getByLabel('Linked game night').selectOption(E2E_RSVP_EVENTS.public)
  await expect(page.getByLabel('Session number')).toHaveValue('1')
  await page.getByLabel('Title').fill('Into Davokar')

  const attendees = page.getByRole('group', { name: 'Attendees' })
  await attendees.getByLabel(E2E_USER.displayName).check()
  await attendees.getByLabel(E2E_GUEST.displayName).check()
  await page.getByRole('group', { name: 'Characters present' }).getByLabel(E2E_CHARACTER.name).check()

  await page.getByLabel('Group-visible recap').fill('The party crossed the forest edge and found a ruined watchtower.')
  await page.getByLabel('Milestone or XP progress').fill('Reached the watchtower milestone.')
  await page.getByLabel('Loot and rewards').fill('An engraved silver key.')
  await page.getByLabel('Quests and objectives').fill('Discover what the key opens.')
  await page.getByLabel('Next-session hooks').fill('A bell rings beneath the ruins.')
  await page.getByLabel('Memorable quotes and moments').fill('Aric opened the door anyway.\nThe ravens answered in unison.')
  await page.getByRole('button', { name: 'Create entry' }).click()

  await expect(page).toHaveURL(new RegExp(`/campaigns/${E2E_CAMPAIGN.id}/adventure-logs/[^/]+$`))
  await expect(page.getByRole('heading', { name: 'Into Davokar', exact: true })).toBeVisible()
  await expect(page.getByText('The party crossed the forest edge and found a ruined watchtower.')).toBeVisible()
  await expect(page.getByText(E2E_CHARACTER.name)).toBeVisible()
  const attendeeList = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Attendees' }) })
  await expect(attendeeList.getByText(E2E_USER.displayName)).toBeVisible()
  await expect(attendeeList.getByText(E2E_GUEST.displayName)).toBeVisible()
  await expect(page.getByRole('link', { name: /Public RSVP Test/ })).toBeVisible()

  const adventureUrl = page.url()
  await page.getByRole('button', { name: 'Edit entry' }).click()
  await page.getByLabel('Group-visible recap').fill('The party crossed the forest edge and secured the ruined watchtower.')
  await page.getByRole('button', { name: 'Save entry' }).click()
  await expect(page.getByText('The party crossed the forest edge and secured the ruined watchtower.')).toBeVisible()

  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  await loginAsGuest(guestPage)
  await guestPage.goto(adventureUrl)
  await expect(guestPage.getByRole('heading', { name: 'Into Davokar', exact: true })).toBeVisible()
  await expect(guestPage.getByText('The party crossed the forest edge and secured the ruined watchtower.')).toBeVisible()
  await expect(guestPage.getByRole('button', { name: 'Edit entry' })).toHaveCount(0)
  await guestContext.close()
})
