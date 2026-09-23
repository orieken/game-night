# Game Night Tracker Modernization Plan

## Goal

Turn the existing Vue prototype into a dependable, mobile-first app for a small game group: hosts can create an event, invite people, choose games, record results, and see a useful history. Keep gamification and AI recommendations out of the first release until the event and results loop is reliable.

## Current-state audit

### What is already in place

- Vue 3, TypeScript, Pinia, Vue Router, Tailwind, Vitest, and Playwright are configured.
- The repository/domain/store shape is a good foundation and should be retained.
- Sign-up/sign-in, game-library reads, game-night listing, and event creation have initial implementations.
- The production build and 12 unit tests pass.

### Product gaps

- No shared application shell, navigation, mobile navigation, profile, settings, empty-state system, or 404 screen.
- Dashboard is static; its actions do not navigate and it reads no data.
- There is no game-night detail route even though cards link to one.
- A game can be viewed but not added or edited from the UI.
- There are no RSVPs, invitations, selected games, sessions/results, leaderboards, history, or notifications.
- Validation, error recovery, loading-state consistency, accessibility semantics, and success feedback are incomplete.

### Technical gaps and risks

- The application is coupled directly to Supabase in the auth store and repositories, despite a clean-domain intent.
- Supabase row types cover only three tables while the documented data model is much broader. Repository writes use TypeScript suppressions.
- Documentation describes Supabase/PostgreSQL while the proposed target is Firebase/Firestore; both cannot remain the source of truth.
- No Firebase configuration, Firestore security rules, emulator setup, indexes, environment template, migrations/seed data, CI workflow, or deployment configuration exists.
- The E2E test signs up against a real backend and needs secrets/network; it is not a repeatable test fixture. Local browser execution currently also cannot bind to port 3000 in this sandbox.
- Tailwind v4 is installed but the stylesheet uses the older `@tailwind` directives; it builds today, but styling should be normalized during the visual-system pass.
- The initial audit found unused scaffolding/dependencies (`HelloWorld.vue`, Vite assets, Axios); those scaffold artifacts have since been removed, while consistent error presentation remains P1 work.

## Recommended product scope

### Release 1: the complete game-night loop

1. Authenticate and create a profile.
2. Create, edit, cancel, and view a game night.
3. Invite members and collect RSVP responses.
4. Maintain a personal/shared game library and add games to an event.
5. Start a play session, select players, record placement/score, and finish it.
6. See event history and a simple leaderboard.

### Later releases

- Ratings, comments, achievements, friends, activity feed, notifications, images, and multi-group support.
- Recommendations and advanced scoring only after enough real session data exists.

## Firestore architecture

### Decision

Adopt Firebase Authentication + Cloud Firestore now, before meaningful user data exists. This is a replacement, not an addition, to Supabase. Retain the domain entities and repository interfaces, then replace their infrastructure implementations with Firebase adapters. Firebase Hosting is the simplest initial deployment choice; Cloud Functions should be reserved for trusted aggregate updates and notifications.

### Data model

Use a group as the authorization boundary. It supports private game nights cleanly and avoids attempting to express relationship joins in Firestore queries.

```
users/{uid}
  displayName, usernameLower, avatarUrl, createdAt, updatedAt

groups/{groupId}
  name, ownerId, memberIds, createdAt, updatedAt
groups/{groupId}/members/{uid}
  role: owner | organizer | member, displayName, avatarUrl, joinedAt
groups/{groupId}/games/{gameId}
  name, description, minPlayers, maxPlayers, durationMinutes,
  complexity, categories, imageUrl, bggId, isAvailable, createdBy,
  createdAt, updatedAt
groups/{groupId}/events/{eventId}
  title, description, startsAt, location, hostId, status,
  capacity, visibility, plannedGameIds, attendeeCounts,
  createdAt, updatedAt
groups/{groupId}/events/{eventId}/rsvps/{uid}
  status: invited | going | maybe | declined | attended | noShow,
  respondedAt, updatedAt
groups/{groupId}/events/{eventId}/sessions/{sessionId}
  gameId, startedAt, endedAt, durationMinutes, notes, createdBy
groups/{groupId}/events/{eventId}/sessions/{sessionId}/players/{uid}
  placement, score, team, displayName
```

Store document IDs in parent documents instead of duplicated game/user records where possible. Denormalize only stable display fields needed for a list. For the first private-table release, derive the leaderboard on demand from host-protected completed session results so the project can remain on Firebase's no-cost Spark plan without accepting client-authored aggregate totals.

### Query and security plan

- Query events with `orderBy(startsAt)` and filters for `status`; query only inside a group the signed-in user belongs to.
- Create composite indexes only after queries are finalized and document each required index in Firebase configuration.
- Firestore rules must verify `request.auth != null` and group membership for every group subcollection. Only owners/organizers can create or edit events; members can update only their own RSVP; only organizers can finalize session results.
- Use the Firebase Emulator Suite in local development and CI. Keep Firebase web config in `.env.local`; commit only `.env.example`. Never put service-account credentials in the client.

## Visual direction: "After Hours Arcade"

Choose a warm, contemporary game-table look rather than the current generic dark-indigo UI: tactile enough for board games, but restrained enough for daily use.

- Palette: ink `#10131A`, surface `#181D27`, elevated surface `#222938`, cream `#F7F1E6`, coral `#FF6B5E`, electric violet `#8B5CF6`, mint `#57D2A4`, and muted slate text.
- Typography: Manrope for interface/body, Fraunces for select display headings, and tabular numerals for scores. Use system fallbacks until self-hosting fonts is deliberately added.
- Layout: persistent desktop rail + compact mobile bottom navigation; a centered content canvas; a clear top-level “Plan a night” action.
- Components: 12px card radius, 8px spacing scale, subtle borders, two elevation levels, and status chips with both icon/text—not color alone.
- Dashboard: next event as the hero, then “Tonight’s library,” “Recent results,” and concise personal stats. Avoid charts until there is enough data to make them useful.
- Event detail: timeline, RSVP roster, selected games, sessions/results, and host controls in one place.
- Accessibility: visible focus states, 44px minimum targets, semantic buttons/labels, keyboard-accessible dialogs, reduced-motion support, and tested contrast.

## Prioritized todo list

### P0 — establish the foundation

- [ ] Confirm Firebase is replacing Supabase and create separate Firebase dev and production projects.
- [ ] Add Firebase Auth, Firestore, Firebase Hosting, Emulator Suite, `.env.example`, and Firebase configuration files. (Client/config/rules are started; Firebase project and hosting remain.)
- [x] Replace `supabaseClient` and the three Supabase repositories with typed Firebase repository adapters; remove `src/types/supabase.ts` and all type suppressions.
- [x] Write Firestore rules, index definitions, and emulator rule tests before deploying.
- [x] Add an auth-session listener and make route guards wait for initialization to prevent redirect flicker.
- [x] Define the group/membership model and create the first-group onboarding flow.
- [x] Remove stale scaffold files/dependencies and add a non-destructive lint script (keep autofix as a separate command).

### P1 — deliver the minimum useful product

- [x] Build app shell, navigation, shared page header, toast/error system, empty states, loading states, and not-found page.
- [x] Implement event detail, edit, cancel, and ownership checks; repair the broken event-card destination.
- [x] Implement invite/RSVP flows with capacity handling.
- [x] Implement game create/edit/search/filter and event game selection.
- [x] Implement session start, player selection, results entry, edit/delete safeguards, and event history.
- [x] Create a basic leaderboard from completed sessions, derived read-only from host-protected results for Spark-plan compatibility.
- [x] Apply the new tokens/components across auth, dashboard, events, games, and mobile breakpoints.

### P2 — quality, operations, and release

- [x] Add domain tests for RSVP transitions, capacity, result validation, and scoring.
- [x] Test Firebase repositories through emulator-backed browser flows; seed deterministic E2E data rather than registering against production.
- [x] Run the repaired IPv4-bound Chromium Playwright suite in CI; add Firefox/WebKit after the core flows are stable.
- [x] Add automated Axe and keyboard accessibility checks for P1 flows.
- [ ] Complete a manual keyboard and screen-reader pass for P1 flows.
- [x] Add GitHub Actions for typecheck, lint, unit tests, emulator integration tests, and E2E tests.
- [ ] Configure preview/production hosting, error monitoring, basic privacy policy, and backup/export expectations.

### P3 — only after P1/P2 are stable

- [ ] Ratings/comments and a lightweight activity feed.
- [ ] Achievements/challenges, based on audited scoring rules.
- [ ] Notifications/reminders via Cloud Functions.
- [ ] Game discovery/import (for example, BoardGameGeek) with terms/rate-limit review.
- [ ] Recommendations once the group has enough historical plays.

## Suggested sequence

1. Make the Firebase decision and scaffold/dev environment.
2. Ship the design system and application shell alongside the auth/onboarding rewrite.
3. Complete events, RSVPs, library, and result tracking vertically, one workflow at a time.
4. Lock down rules and automate emulator-backed tests before inviting real users.
5. Add leaderboards, polish responsive/accessibility behavior, then deploy a small private beta.

## Open decisions to settle before implementation

- Is the first release for one private household/group, or must users create and join multiple groups?
- Are guests required to have accounts, or can a host record guest players?
- Resolved: games are owned by each group for the first release.
- Do you want Firebase Hosting, or do you already prefer a different host?
