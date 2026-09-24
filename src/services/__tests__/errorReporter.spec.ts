import { describe, expect, it } from 'vitest'
import { buildClientErrorReport, sanitizeErrorText } from '../errorReporter'

describe('errorReporter', () => {
  it('redacts emails, Firebase-style credentials, bearer tokens, and sensitive query values', () => {
    const value = 'user@example.com AIzaabcdefghijklmnopqrstuvwxyz Bearer abc.def.ghi ?token=secret-value'

    expect(sanitizeErrorText(value)).toBe(
      '[email redacted] [credential redacted] Bearer [credential redacted] ?token=[redacted]'
    )
  })

  it('builds a bounded report without user identity or URL query data', () => {
    const error = new Error(`Could not load for player@example.com ${'x'.repeat(600)}`)
    const report = buildClientErrorReport({
      kind: 'vue',
      error,
      component: 'CampaignDetails',
      info: 'render function'
    })

    expect(report.id).toBeTruthy()
    expect(report.kind).toBe('vue')
    expect(report.message).not.toContain('player@example.com')
    expect(report.message.length).toBeLessThanOrEqual(500)
    expect(report.component).toBe('CampaignDetails')
    expect(report.path).toBe('/')
  })
})
