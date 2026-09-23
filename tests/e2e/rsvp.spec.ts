import { expect, test, type Page } from '@playwright/test'
import { loginAsGuest, loginAsHost } from './helpers'
import { E2E_RSVP_EVENTS } from './seedData'

function attendanceSection(page: Page) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Attendance' })
  })
}

test('persists RSVP transitions and keeps the attendee count in sync', async ({ page }) => {
  await loginAsHost(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.public}`)

  const attendance = attendanceSection(page)
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

test('rejects a going RSVP when the event has no remaining capacity', async ({ page }) => {
  await loginAsGuest(page)
  await page.goto(`/game-nights/${E2E_RSVP_EVENTS.full}`)

  const attendance = attendanceSection(page)
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
