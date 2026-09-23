import { expect, type Page } from '@playwright/test'
import { E2E_GUEST, E2E_USER } from './seedData'

export async function loginAsHost(page: Page) {
  await login(page, E2E_USER)
}

export async function loginAsGuest(page: Page) {
  await login(page, E2E_GUEST)
}

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Make tonight count.' })).toBeVisible()
}
