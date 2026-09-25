# Board Game Catalog and Tabletop RPG Roadmap

## Goal

Make it easy for a private group to add accurate board-game information to its shared library, while expanding game nights to support lightweight tabletop RPG campaign planning and adventure history. Keep full character-sheet automation and rules-engine behavior out of the initial scope.

## Product decisions

- Keep the app private, non-commercial, and intended for a friendly family group.
- Use BoardGameGeek as the source for board-game catalog searches and imported metadata.
- Keep BoardGameGeek-sourced data distinct from local fields such as availability and group notes.
- Continue supporting manual game entry when a catalog match is unavailable.
- Keep board games and tabletop RPG nights in the same app because they share groups, scheduling, invitations, RSVPs, attendance, and history.
- Model board-game, tabletop RPG, and mixed events explicitly.
- Treat progression-driven board games as campaigns without pretending they use tabletop-RPG ownership rules.
- Support D&D 5e, 5e-derived settings, and Symbaroum without coupling campaign storage to one rules engine, edition, or publisher.
- Start with lightweight, system-flexible campaigns, player-managed character summaries, and adventure logs rather than building a complete D&D character manager.
- Make full recaps visible to campaign players and reserve an optional, deliberately published public story highlight for a later release.
- Treat optional SRD rules lookup as a later enhancement, not a dependency of campaign tracking.

## Phase 1 — BoardGameGeek catalog import

- [x] Draft the non-commercial application description for BoardGameGeek API registration.
- [x] Register the application with BoardGameGeek and obtain an application token.
- [x] Add the BGG token to local and Netlify server-side environment configuration; never expose it through a `VITE_` variable.
- [x] Add a Netlify Function that authenticates with BGG and converts XML responses into the app's JSON format.
- [x] Add typed catalog entities and an interface so the UI does not depend directly on BGG response shapes.
- [x] Implement debounced catalog search with a minimum query length and useful timeout/error handling.
- [x] Show title, publication year, cover, player count, and playing time in search results so similarly named games can be distinguished.
- [x] Fetch full details only after a search result is selected.
- [x] Map supported BGG fields into preserved source metadata: ID, canonical name, description, images, player counts, playing time, categories, mechanics, publication year, and complexity weight.
- [x] Keep imported source metadata separate from the editable local game fields.
- [x] Preserve manual game creation and editing as a fallback.
- [x] Prevent duplicate imports of the same BGG game into one group, while allowing an intentional second physical copy later.
- [x] Add required “Powered by BGG” attribution and a link to the source game page.
- [x] Add unit tests for XML parsing, mapping, duplicate detection, and error handling.
- [x] Add emulator-backed E2E tests for search, import, duplicate prevention, and manual fallback.
- [x] Document local token setup, Netlify token setup, attribution, and non-commercial-use constraints.

## Phase 2 — Event types and campaigns

- [x] Confirm D&D 5e and 5e-derived settings as the initial RPG family.
- [x] Identify Symbaroum as the additional RPG system the group may play.
- [x] Support both original Symbaroum and the 5e-based Ruins of Symbaroum adaptation.
- [x] Add `board_game`, `tabletop_rpg`, and `mixed` event types with backward-compatible defaults for existing events.
- [x] Update event creation, detail, and cards to present each event type clearly.
- [x] Add event-type filters and type-aware history views.
- [x] Add campaign entities and Firestore repositories under each group.
- [x] Store campaign name, description, system, variant/edition, status, DM IDs, member IDs, optional external links, and optional character-field definitions.
- [x] Add campaign create, edit, archive, list, and detail views.
- [x] Allow RPG and mixed events to link to a campaign.
- [x] Reuse existing invite, RSVP, capacity, attendance, and share-link behavior for RPG events.
- [x] Update Firestore rules, indexes, emulator rule tests, and E2E fixtures for campaigns and event types.

## Phase 3 — Characters and adventure logs

- [x] Allow players to manage their own character details; allow DMs to manage campaign membership and archival status.
- [x] Add lightweight character summaries with universal fields: name, player, pronouns, status, portrait URL, external sheet URL, and public notes.
- [x] Add optional system-defined character fields for concepts such as class, subclass, level, species/ancestry, attributes, corruption, abilities, or differently named stats without implementing game-rule calculations.
- [x] Add character create, edit, retire, detail, and campaign-roster views.
- [x] Add a campaign-independent character vault for drafts and reusable trial characters.
- [x] Add separate table visibility and copy permissions, with private player-owned copies and source attribution.
- [x] Show permitted vault and campaign characters on player profiles and allow vault characters to be added to campaigns.
- [x] Add campaign session logs linked to their scheduled events.
- [x] Record session number, title, date, attendees, characters present, group-visible recap, milestone/XP progress, loot, quests, memorable quotes/moments, and next-session hooks.
- [x] Add adventure-log create, edit, list, and detail views for campaign participants.
- [x] Keep private DM notes in separately protected documents that ordinary campaign members cannot read.
- [x] Add an optional short public story highlight that must be explicitly published and contains no private recap or DM-note fields.
- [x] Publish public highlights through separate sanitized documents/routes so anonymous readers never receive the private campaign document.
- [x] Add campaign history and RPG attendance statistics without mixing RPG sessions into the competitive board-game leaderboard.
- [x] Add Firestore rules and emulator tests for player-owned character edits, DM controls, public recaps, and private notes.
- [x] Add E2E coverage for campaign creation, RPG scheduling, character management, and session recaps.

## Phase 4 — Optional rules reference

- [x] Validate the content license and attribution requirements for each intended SRD source. See [RPG rules API research](rpg-rules-api-research.md).
- [x] Choose Open5e V2 with an SRD-only source allowlist based on the editions and systems the group actually uses.
- [x] Add opt-in spell, creature, equipment, and rules lookup without copying unsupported commercial content.
- [x] Keep campaign and character features functional if the reference API is unavailable.

## Phase 5 — Campaign board games

- [x] Distinguish tabletop RPG campaigns from campaign board games while defaulting older campaigns to tabletop RPGs.
- [x] Allow campaign board games to link to a title in the shared game library and to board-game or mixed events.
- [x] Add a HeroQuest preset for hero type, Body Points, Mind Points, gold, equipment, artifacts, spells, and completed quests.
- [x] Support table-owned heroes with an optional current controller who can update progression without reassigning the hero.
- [x] Keep player-owned characters available for players who want a permanently personal hero.
- [x] Add Firestore authorization tests and an end-to-end HeroQuest campaign and shared-hero workflow.

## BoardGameGeek API registration description

### API client

`Game Night web app — https://rieken-game-night.netlify.app/`

### Short version

Game Night is a small, non-commercial web app for a private group of friends and family to organize board-game nights. Members maintain a shared game library, schedule events, send RSVP links, select games, record completed plays, and view group history and standings. We would use the BoardGameGeek XML API to let organizers search for games and import basic catalog metadata such as the title, cover image, player count, playing time, categories, description, and BoardGameGeek ID. Imported data is displayed with BoardGameGeek attribution, requests are made through a server-side proxy using an application token, and the app does not sell or redistribute the data.

### Longer version

Game Night is a small, non-commercial web application used by a private group of friends and family to organize in-person board-game gatherings. The app allows group members to maintain a shared library, schedule game nights, invite attendees through private RSVP links, select games for an event, record completed sessions and results, and review the group's play history and standings.

We would use the BoardGameGeek XML API only when an organizer searches for or imports a title into the group's library. The integration would retrieve basic catalog metadata such as the canonical title, publication year, cover image, description, minimum and maximum player counts, estimated playing time, categories, mechanics, complexity weight, and BoardGameGeek ID. The selected metadata would be stored with the group's game record so routine use of the app does not repeatedly query the API.

API requests would be made through a server-side Netlify Function so the application token is not exposed in browser code. Search requests would be debounced and limited, full details would be requested only after a user selects a result, and manual entry would remain available. BoardGameGeek would be credited as the source with the required “Powered by BGG” attribution and links back to relevant BoardGameGeek pages. The application is not monetized and does not sell, sublicense, train AI with, or otherwise redistribute BoardGameGeek data.

## Open decisions

- Who may publish a public story highlight: only the DM, or the DM plus the player who wrote it?
- Should multiple physical copies or editions of the same BGG title be supported in the first catalog release?
