import { expect, test, type Page } from '@playwright/test'
import { loginAsGuest, loginAsHost } from './helpers'
import { E2E_CAMPAIGN, E2E_GUEST, E2E_RSVP_EVENTS } from './seedData'

function attendanceSection(page: Page) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Attendance' })
  })
}

test('persists RPG event RSVP transitions and keeps attendance in sync', async ({ page }) => {
  await loginAsHost(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.public}`)

  const attendance = attendanceSection(page)
  await expect(page.getByRole('link', { name: `View ${E2E_CAMPAIGN.name} →` })).toBeVisible()
  await expect(attendance).toContainText('0 of 4 going')

  await attendance.getByRole('button', { name: 'Going', exact: true }).click()
  await expect(page.getByText('RSVP updated to going.')).toBeVisible()
  await expect(attendance).toContainText('1 of 4 going')
  await expect(attendance).toContainText('Your RSVP: going')

  await page.reload()
  await expect(attendance).toContainText('1 of 4 going')
  await expect(attendance).toContainText('Your RSVP: going')

  await attendance.getByRole('button', { name: 'Maybe', exact: true }).click()
  await expect(page.getByText('RSVP updated to maybe.')).toBeVisible()
  await expect(attendance).toContainText('0 of 4 going')
  await expect(attendance).toContainText('Your RSVP: maybe')
})

test('enforces capacity for a campaign-linked mixed event', async ({ page }) => {
  await loginAsGuest(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.full}`)

  const attendance = attendanceSection(page)
  await expect(page.getByText('Mixed night', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: `View ${E2E_CAMPAIGN.name} →` })).toBeVisible()
  await expect(attendance).toContainText('0 of 0 going')
  await attendance.getByRole('button', { name: 'Going', exact: true }).click()

  await expect(attendance.getByText('This game night is full.')).toBeVisible()
  await expect(attendance).toContainText('0 of 0 going')
  await expect(attendance).not.toContainText('Your RSVP: going')
})

test('allows an invited member to RSVP to a private event', async ({ page }) => {
  await loginAsGuest(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.invitedPrivate}`)

  const attendance = attendanceSection(page)
  await expect(attendance.getByLabel('RSVP options')).toBeVisible()
  await attendance.getByRole('button', { name: 'Going', exact: true }).click()

  await expect(page.getByText('RSVP updated to going.')).toBeVisible()
  await expect(attendance).toContainText('1 of 4 going')
  await expect(attendance).toContainText('Your RSVP: going')
})

test('hides RSVP controls from an uninvited member of a private event', async ({ page }) => {
  await loginAsGuest(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.uninvitedPrivate}`)

  const attendance = attendanceSection(page)
  await expect(attendance.getByText('This is an invitation-only event.')).toBeVisible()
  await expect(attendance.getByLabel('RSVP options')).toHaveCount(0)
})

test('lets a guest join a private RPG event and RSVP from its share link', async ({ page, browser }) => {
  await loginAsHost(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.uninvitedPrivate}`)
  await expect(page.getByRole('link', { name: `View ${E2E_CAMPAIGN.name} →` })).toBeVisible()

  const sharing = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Share an RSVP link' })
  })
  await sharing.getByRole('button', { name: 'Create RSVP link' }).click()
  await expect(page.getByText('RSVP link ready to share.')).toBeVisible()
  const inviteUrl = await sharing.getByLabel('RSVP link').inputValue()
  expect(inviteUrl).toContain('/invite/')

  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  await guestPage.goto(inviteUrl)
  await expect(guestPage).toHaveURL(/\/login\?redirect=/)
  await guestPage.getByLabel('Email').fill(E2E_GUEST.email)
  await guestPage.getByLabel('Password').fill(E2E_GUEST.password)
  await guestPage.getByRole('button', { name: 'Sign in' }).click()

  await expect(guestPage.getByRole('heading', { name: 'Uninvited Private RSVP Test' })).toBeVisible()
  await guestPage.getByRole('button', { name: 'Join table and RSVP' }).click()
  await expect(guestPage).toHaveURL(`/game-nights/${E2E_RSVP_EVENTS.uninvitedPrivate}`)
  await expect(guestPage.getByRole('link', { name: `View ${E2E_CAMPAIGN.name} →` })).toBeVisible()

  const guestAttendance = attendanceSection(guestPage)
  await guestAttendance.getByRole('button', { name: 'Going', exact: true }).click()
  await expect(guestPage.getByText('RSVP updated to going.')).toBeVisible()
  await expect(guestAttendance).toContainText('1 of 4 going')
  await guestContext.close()
})
