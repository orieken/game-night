# Game Night Modernization Status

Last updated: September 2026

## Goal

Maintain a dependable, mobile-friendly app for a private game group: members can plan events, collect RSVPs, manage a shared library, record results, follow tabletop RPG campaigns, and review their history.

## Current architecture

- Vue 3, TypeScript, Vite, Pinia, Vue Router, and Tailwind CSS
- Firebase Authentication and Cloud Firestore
- Group-scoped Firestore data protected by deployed Security Rules
- Netlify hosting and Netlify Functions
- BoardGameGeek XML API access through a server-only function
- Vitest unit tests, Firebase emulator rule tests, and Playwright E2E tests

Firebase replaced the original Supabase proposal. Netlify, rather than Firebase Hosting, is the production host. The Firebase Emulator Suite serves as the isolated local/test backend, so a separate cloud development project has not been required for routine development.

## Delivered product scope

### Foundation and security

- [x] Replace Supabase adapters with typed Firebase repositories.
- [x] Add Firebase Authentication session handling and guarded routes.
- [x] Define group membership and first-table onboarding.
- [x] Add Firestore rules, indexes, and emulator-backed authorization tests.
- [x] Add reusable loading, empty, error, toast, navigation, and not-found states.
- [x] Add CI checks for typecheck, lint, unit tests, rules tests, and E2E tests.
- [x] Deploy the app on Netlify and Firestore rules to the production Firebase project.

### Board-game loop

- [x] Create, edit, cancel, list, and view game nights.
- [x] Share invitation links and collect RSVPs with capacity handling.
- [x] Manage the shared game library and attach games to events.
- [x] Search and import catalog metadata from BoardGameGeek with manual fallback.
- [x] Record completed sessions, placements, scores, and attendance.
- [x] Show event history and a Spark-plan-compatible derived leaderboard.
- [x] Add player lists and profiles with personal statistics.

### Tabletop RPG support

- [x] Add board-game, tabletop RPG, and mixed event types.
- [x] Add system-flexible campaigns and campaign membership.
- [x] Add campaign characters plus reusable, copyable vault characters.
- [x] Add adventure logs, private DM notes, and campaign attendance statistics.
- [x] Add deliberately published, sanitized public story highlights.

Detailed implementation history and optional rules-reference work are tracked in [game-catalog-rpg-roadmap.md](game-catalog-rpg-roadmap.md).

## Remaining release operations

- [ ] Decide whether a separate Firebase cloud development project is useful beyond the local emulator suite.
- [ ] Add production error monitoring with a documented response process.
- [ ] Publish a short privacy policy appropriate for a private friends-and-family app.
- [ ] Document Firestore backup/export expectations and a recovery check.
- [ ] Perform periodic manual accessibility and mobile-device regression passes.

## Future product backlog

- [x] Optional open-license RPG rules lookup with SRD-only source enforcement; see Phase 4 of the RPG roadmap.
- [ ] Ratings, comments, and a lightweight activity feed.
- [ ] Achievements and challenges based on reviewed scoring rules.
- [ ] Notifications or reminders that preserve the Firebase free-tier goal.
- [ ] Recommendations after the group has enough historical play data.

These items are optional follow-on work, not blockers for the current private release.

## Data and authorization principles

- A group is the primary authorization boundary.
- Owners and organizers control shared table resources.
- Members can edit only their own permitted records.
- Competitive board-game statistics and RPG attendance statistics remain separate.
- Sensitive campaign data stays in protected group paths.
- Anonymous access is limited to explicitly published, sanitized story documents.
- Third-party credentials remain in server-only environment variables.
