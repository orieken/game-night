import type { Config } from '@netlify/functions'

type ErrorKind = 'vue' | 'window' | 'unhandled-rejection'
type UnknownRecord = Record<string, unknown>

const allowedKinds = new Set<ErrorKind>(['vue', 'window', 'unhandled-rejection'])

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}
}

function clean(value: unknown, maximum: number): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]')
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[credential redacted]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [credential redacted]')
    .replace(/([?&](?:token|key|code|secret|password)=)[^&#\s]+/gi, '$1[redacted]')
    .slice(0, maximum)
}

export function sanitizeClientError(value: unknown): UnknownRecord | null {
  const input = record(value)
  const id = clean(input.id, 100)
  const kind = clean(input.kind, 30) as ErrorKind | null
  const message = clean(input.message, 500)
  const path = clean(input.path, 300)
  const occurredAt = clean(input.occurredAt, 50)

  if (!id || !kind || !allowedKinds.has(kind) || !message || !path?.startsWith('/') || !occurredAt) return null

  return {
    id,
    kind,
    message,
    stack: clean(input.stack, 3_000),
    component: clean(input.component, 200),
    info: clean(input.info, 300),
    path: path.split('?')[0]?.split('#')[0] ?? '/',
    occurredAt
  }
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  const rawBody = await request.text()
  if (rawBody.length > 10_000) return json({ error: 'Error report is too large.' }, 413)

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid error report.' }, 400)
  }

  const report = sanitizeClientError(parsed)
  if (!report) return json({ error: 'Invalid error report.' }, 400)

  console.error(`[client-error] ${JSON.stringify(report)}`)
  return json({ accepted: true, id: report.id }, 202)
}

export const config: Config = {
  path: '/api/client-errors',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
