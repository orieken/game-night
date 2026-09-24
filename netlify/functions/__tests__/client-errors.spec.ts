import { afterEach, describe, expect, it, vi } from 'vitest'
import handler, { sanitizeClientError } from '../client-errors'

const validReport = {
  id: 'error-reference-1',
  kind: 'vue',
  message: 'Failed for player@example.com',
  stack: 'Error at https://example.com/app.js?token=secret',
  component: 'CampaignDetail',
  info: 'render function',
  path: '/campaigns/campaign-1?invite=private',
  occurredAt: '2026-09-24T12:00:00.000Z'
}

describe('client error endpoint', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sanitizes reports and strips route query data', () => {
    expect(sanitizeClientError(validReport)).toMatchObject({
      message: 'Failed for [email redacted]',
      path: '/campaigns/campaign-1'
    })
  })

  it('rejects malformed reports', async () => {
    const response = await handler(new Request('https://example.com/api/client-errors', {
      method: 'POST',
      body: JSON.stringify({ kind: 'unknown' })
    }))

    expect(response.status).toBe(400)
  })

  it('writes a validated report to function logs and returns its reference', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = await handler(new Request('https://example.com/api/client-errors', {
      method: 'POST',
      body: JSON.stringify(validReport)
    }))

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ accepted: true, id: validReport.id })
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[client-error]'))
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('player@example.com'))
  })
})
