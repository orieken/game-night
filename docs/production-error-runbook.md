# Production Error Monitoring and Response

Last updated: September 24, 2026

## What is captured

The production Vue app reports uncaught render errors, browser errors, and unhandled promise rejections to the rate-limited `/api/client-errors` Netlify Function. The function writes validated reports to Netlify Function logs with the prefix `[client-error]`.

Reports contain only:

- a random error reference shown to the user;
- error type, sanitized message, and bounded stack trace;
- component/debug context supplied by Vue;
- the route path without query parameters or fragments; and
- the client timestamp.

The reporter does not intentionally include account IDs, display names, email addresses, form values, cookies, Firebase tokens, or URL query values. Email-like values, Firebase-style API credentials, bearer tokens, and common sensitive query values are redacted on both the browser and server. Treat sanitization as defense in depth: do not manually attach user-entered data to error messages.

Local development does not transmit reports. Developers continue to see errors in the browser console.

## Finding an error

1. Ask the player for the displayed error reference and approximate time.
2. Open the Netlify site dashboard.
3. Open **Logs & Metrics → Functions** and select `client-errors`.
4. Search for `[client-error]` and the reference ID.
5. Match the route, component, message, and deploy time to the relevant Git commit.

Log availability and retention depend on the active Netlify plan. Error reports are operational diagnostics, not a durable audit log.

## Triage

Classify the issue before changing code:

- **Single stale browser session:** ask the player to reload and retry.
- **Current deploy regression:** reproduce locally, add a failing test, fix, and deploy.
- **Firebase permission error:** verify the active group, request path, deployed rules, and rule tests. Do not weaken rules merely to remove an error.
- **Third-party outage:** confirm that BGG or Open5e fallback UI works; avoid blocking core workflows.
- **Bad or missing environment configuration:** verify variable names and deploy context without printing values.
- **Repeated unknown traffic:** review rate limits and request validation before adding infrastructure.

## Response expectations

- Protect user data and authorization boundaries ahead of availability.
- Prefer a rollback for a broad production regression.
- Preserve the error reference in the commit or issue description.
- Add regression coverage for every confirmed application defect.
- Never paste secrets, full authentication responses, or private campaign text into logs or issue trackers.

## Recovery behavior

Vue render failures are contained by `AppErrorBoundary`. Instead of a blank page, the player sees a recovery screen with:

- a reload action;
- a dashboard link; and
- the error reference used to locate the sanitized Netlify log.

Ordinary repository failures remain handled by their existing inline error/retry states. Optional BGG and Open5e failures do not disable core game-night, campaign, or character features.
