# Game Night

A private, non-commercial app for friends and family to organize board-game nights and tabletop RPG campaigns.

**Live app:** [rieken-game-night.netlify.app](https://rieken-game-night.netlify.app/)

## What the app supports

- Email/password accounts, player profiles, and private table membership
- Board-game library management with BoardGameGeek search and manual entry
- Board-game, tabletop RPG, and mixed game-night events
- Shareable invitations, RSVPs, capacity limits, and attendance
- Completed play sessions, results, history, and a board-game leaderboard
- System-flexible campaigns for D&D 5e, 5e-derived settings, original Symbaroum, and Ruins of Symbaroum
- Player-managed campaign characters and a reusable character vault
- Adventure logs, separately protected DM notes, campaign attendance statistics, and optional public story highlights
- Optional 2014/2024 SRD lookup for spells, creatures, equipment, and rules

The detailed catalog and RPG roadmap lives in [docs/game-catalog-rpg-roadmap.md](docs/game-catalog-rpg-roadmap.md).

## Technology

- Vue 3, TypeScript, Vite, Pinia, Vue Router, and Tailwind CSS
- Firebase Authentication and Cloud Firestore
- Firestore Security Rules and the Firebase Emulator Suite
- Netlify hosting and Netlify Functions
- Vitest for unit and rules tests
- Playwright for browser tests

## Local setup

Requirements:

- Node.js 20 or newer
- Java 21 or newer for the Firestore emulator

Install dependencies and create local configuration:

```sh
npm install
cp .env.example .env
```

Fill in the Firebase web configuration values in `.env`. Firebase web configuration is used by the browser and access is enforced by Authentication and Firestore Security Rules.

For live BoardGameGeek search, also set:

```dotenv
BGG_API_TOKEN=your-server-only-token
```

Never prefix the BGG token with `VITE_`; only server-side Netlify Functions should receive it. `.env` and editor history files are ignored by Git.

Run the frontend alone:

```sh
npm run dev
```

Run through Netlify Dev when testing `/api/bgg/*` locally:

```sh
npx netlify dev
```

## Testing

```sh
npm run typecheck
npm run lint
npm run test:unit -- --run
npm run test:rules
npm run test:e2e
npm run test:e2e:headed
npm run firebase:recovery-check
npm run build
```

The rules and browser suites use Firebase emulators and the demo project ID; they do not write to production Firebase data. The Playwright global setup creates deterministic local accounts and fixtures.

## Deployment

Netlify builds the site with `npm run build` and publishes `dist`.

Configure these environment variables in Netlify:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `BGG_API_TOKEN` — server-only; no `VITE_` prefix

Environment-variable changes require a new Netlify deploy before Functions receive the new values.

Deploy Firestore rules and indexes separately:

```sh
npx firebase deploy --only firestore:rules,firestore:indexes --project rieken-game-night
```

Create a local, Spark-plan-compatible Firestore backup:

```sh
export GOOGLE_APPLICATION_CREDENTIALS=/private/path/to/service-account.json
export FIREBASE_PROJECT_ID=rieken-game-night
npm run firebase:backup
```

Recovery is merge-only and requires a dry run plus explicit project confirmation. Follow the complete [Firestore backup and recovery runbook](docs/firestore-backup-recovery.md); backup JSON and service-account files must never be committed.

## Data and security model

- A group/table is the main authorization boundary.
- Owners and organizers manage events, campaigns, and the shared library.
- Members can update only the records explicitly permitted by Firestore rules, such as their own RSVP or owned character.
- Private adventure recaps and DM notes remain inside protected group paths.
- Public story highlights are deliberately published as sanitized documents on a separate public path.
- BoardGameGeek tokens and any future third-party credentials stay in server-only environment variables.

## Project documentation

- [Current modernization status](docs/modernization-plan.md)
- [Board-game catalog and RPG roadmap](docs/game-catalog-rpg-roadmap.md)
- [Testing guide](docs/agents/testing.md)
- [Coding standards](docs/agents/coding-standards.md)
- [Architecture decisions](docs/agents/architecture.md)
- [Production error monitoring and response](docs/production-error-runbook.md)
- [Firestore backup and recovery](docs/firestore-backup-recovery.md)

Some older design documents describe the original Supabase/PostgreSQL proposal. They are retained as historical references and are labeled accordingly; Firebase and Firestore are the current implementation.
