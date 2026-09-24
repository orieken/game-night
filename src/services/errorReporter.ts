export type ClientErrorKind = 'vue' | 'window' | 'unhandled-rejection'

export interface ClientErrorContext {
  kind: ClientErrorKind
  error: unknown
  component?: string | null
  info?: string | null
}

export interface ClientErrorReport {
  id: string
  kind: ClientErrorKind
  message: string
  stack: string | null
  component: string | null
  info: string | null
  path: string
  occurredAt: string
}

const recentReports = new Map<string, number>()
const REPORT_DEDUPLICATION_MS = 30_000

function limit(value: string, maximum: number): string {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value
}

export function sanitizeErrorText(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]')
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[credential redacted]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [credential redacted]')
    .replace(/([?&](?:token|key|code|secret|password)=)[^&#\s]+/gi, '$1[redacted]')
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name
  if (typeof error === 'string') return error
  return 'Unexpected application error'
}

function errorStack(error: unknown): string | null {
  return error instanceof Error && error.stack ? error.stack : null
}

function safePath(): string {
  if (typeof globalThis.location === 'undefined') return '/'
  return limit(globalThis.location.pathname || '/', 300)
}

function reportId(): string {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `error-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildClientErrorReport(context: ClientErrorContext): ClientErrorReport {
  const message = limit(sanitizeErrorText(errorMessage(context.error)), 500)
  const stack = errorStack(context.error)

  return {
    id: reportId(),
    kind: context.kind,
    message,
    stack: stack ? limit(sanitizeErrorText(stack), 3_000) : null,
    component: context.component ? limit(sanitizeErrorText(context.component), 200) : null,
    info: context.info ? limit(sanitizeErrorText(context.info), 300) : null,
    path: safePath(),
    occurredAt: new Date().toISOString()
  }
}

export function reportClientError(context: ClientErrorContext): string {
  const report = buildClientErrorReport(context)
  const fingerprint = `${report.kind}:${report.message}:${report.path}`
  const now = Date.now()
  const lastReported = recentReports.get(fingerprint) ?? 0

  if (now - lastReported < REPORT_DEDUPLICATION_MS || import.meta.env.DEV) return report.id
  recentReports.set(fingerprint, now)

  void fetch('/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
    keepalive: true
  }).catch(() => undefined)

  return report.id
}

export function installGlobalErrorReporting(): () => void {
  const handleError = (event: ErrorEvent) => {
    reportClientError({ kind: 'window', error: event.error ?? event.message })
  }
  const handleRejection = (event: PromiseRejectionEvent) => {
    reportClientError({ kind: 'unhandled-rejection', error: event.reason })
  }

  globalThis.addEventListener('error', handleError)
  globalThis.addEventListener('unhandledrejection', handleRejection)

  return () => {
    globalThis.removeEventListener('error', handleError)
    globalThis.removeEventListener('unhandledrejection', handleRejection)
  }
}
