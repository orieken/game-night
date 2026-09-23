# Board Game Catalog and Tabletop RPG Roadmap

## Goal

Make it easy for a private group to add accurate board-game information to its shared library, while expanding game nights to support lightweight tabletop RPG campaign planning and adventure history. Keep full character-sheet automation and rules-engine behavior out of the initial scope.

## Product decisions

- Use BoardGameGeek as the source for board-game catalog searches and imported metadata.
- Keep BoardGameGeek-sourced data distinct from local fields such as availability and group notes.
- Continue supporting manual game entry when a catalog match is unavailable.
- Keep board games and tabletop RPG nights in the same app because they share groups, scheduling, invitations, RSVPs, attendance, and history.
- Model board-game, tabletop RPG, and mixed events explicitly.
- Start with lightweight campaigns, character summaries, and adventure logs rather than building a complete D&D character manager.
- Treat optional SRD rules lookup as a later enhancement, not a dependency of campaign tracking.

## Phase 1 — BoardGameGeek catalog import

- [x] Draft the non-commercial application description for BoardGameGeek API registration.
- [ ] Register the application with BoardGameGeek and obtain an application token.
- [ ] Add the BGG token to local and Netlify server-side environment configuration; never expose it through a `VITE_` variable.
- [ ] Add a Netlify Function that authenticates with BGG and converts XML responses into the app's JSON format.
- [ ] Add typed catalog entities and an interface so the UI does not depend directly on BGG response shapes.
- [ ] Implement debounced catalog search with a minimum query length and useful timeout/error handling.
- [ ] Show title, publication year, cover, player count, and playing time in search results so similarly named games can be distinguished.
- [ ] Fetch full details only after a search result is selected.
- [ ] Map supported BGG fields into read-only source metadata: ID, canonical name, description, images, player counts, playing time, categories, mechanics, publication year, and complexity weight.
- [ ] Keep local fields separate: availability, group notes, copy/edition notes, expansions owned, and condition/missing-piece notes.
- [ ] Preserve manual game creation and editing as a fallback.
- [ ] Prevent duplicate imports of the same BGG game into one group, while allowing an intentional second physical copy later.
- [ ] Add required “Powered by BGG” attribution and a link to the source game page.
- [ ] Add unit tests for XML parsing, mapping, duplicate detection, and error handling.
- [ ] Add emulator-backed E2E tests for search, import, manual fallback, and duplicate prevention.
- [ ] Document local token setup, Netlify token setup, attribution, and non-commercial-use constraints.

## Phase 2 — Event types and campaigns

- [ ] Confirm the RPG systems and editions the group uses.
- [ ] Add `board_game`, `tabletop_rpg`, and `mixed` event types with backward-compatible defaults for existing events.
- [ ] Update event creation, detail, cards, filters, and history to present each event type clearly.
- [ ] Add campaign entities and Firestore repositories under each group.
- [ ] Store campaign name, description, system, edition, status, DM IDs, member IDs, and optional external links.
- [ ] Add campaign create, edit, archive, list, and detail views.
- [ ] Allow RPG and mixed events to link to a campaign.
- [ ] Reuse existing invite, RSVP, capacity, attendance, and share-link behavior for RPG events.
- [ ] Update Firestore rules, indexes, emulator rule tests, and E2E fixtures for campaigns and event types.

## Phase 3 — Characters and adventure logs

- [ ] Decide whether players manage their own characters or DMs manage the whole party.
- [ ] Add lightweight character summaries: name, player, class, subclass, level, species/ancestry, pronouns, status, portrait URL, external sheet URL, and public notes.
- [ ] Add character create, edit, retire, and campaign-roster views.
- [ ] Add campaign session logs linked to their scheduled events.
- [ ] Record session number, title, date, attendees, characters present, public recap, milestone/XP progress, loot, quests, and next-session hooks.
- [ ] Keep private DM notes in separately protected documents that ordinary campaign members cannot read.
- [ ] Add campaign history and RPG attendance statistics without mixing RPG sessions into the competitive board-game leaderboard.
- [ ] Add Firestore rules and emulator tests for player-owned character edits, DM controls, public recaps, and private notes.
- [ ] Add E2E coverage for campaign creation, RPG scheduling, character management, and session recaps.

## Phase 4 — Optional rules reference

- [ ] Validate the content license and attribution requirements for each intended SRD source.
- [ ] Choose between the 5e SRD API and Open5e based on the editions and systems the group actually uses.
- [ ] Add opt-in spell, monster, equipment, or rules lookup without copying unsupported commercial content.
- [ ] Keep campaign and character features functional if the reference API is unavailable.

## BoardGameGeek API registration description

### Short version

Game Night is a small, non-commercial web app for a private group of friends and family to organize board-game nights. Members maintain a shared game library, schedule events, send RSVP links, select games, record completed plays, and view group history and standings. We would use the BoardGameGeek XML API to let organizers search for games and import basic catalog metadata such as the title, cover image, player count, playing time, categories, description, and BoardGameGeek ID. Imported data is displayed with BoardGameGeek attribution, requests are made through a server-side proxy using an application token, and the app does not sell or redistribute the data.

### Longer version

Game Night is a small, non-commercial web application used by a private group of friends and family to organize in-person board-game gatherings. The app allows group members to maintain a shared library, schedule game nights, invite attendees through private RSVP links, select games for an event, record completed sessions and results, and review the group's play history and standings.

We would use the BoardGameGeek XML API only when an organizer searches for or imports a title into the group's library. The integration would retrieve basic catalog metadata such as the canonical title, publication year, cover image, description, minimum and maximum player counts, estimated playing time, categories, mechanics, complexity weight, and BoardGameGeek ID. The selected metadata would be stored with the group's game record so routine use of the app does not repeatedly query the API.

API requests would be made through a server-side Netlify Function so the application token is not exposed in browser code. Search requests would be debounced and limited, full details would be requested only after a user selects a result, and manual entry would remain available. BoardGameGeek would be credited as the source with the required “Powered by BGG” attribution and links back to relevant BoardGameGeek pages. The application is not monetized and does not sell, sublicense, train AI with, or otherwise redistribute BoardGameGeek data.

## Open decisions

- Is the app expected to remain strictly private and non-commercial?
- Which RPG systems and editions should be supported first?
- Should players edit their own character summaries, or should DMs manage the entire party?
- Should campaign recaps be visible to all group members while DM notes remain private?
- Should multiple physical copies or editions of the same BGG title be supported in the first catalog release?
