# RPG Rules API Research

Last reviewed: September 24, 2026

## Decision

Use **Open5e API V2** for an optional read-only 5e rules reference, limited initially to the `srd-2014` and `srd-2024` documents. Access it through a Netlify Function that normalizes responses, enforces the source allowlist, adds timeouts and caching, and returns a graceful unavailable state.

Do not copy or expose original Symbaroum or Ruins of Symbaroum rules through this feature. Those campaigns should continue using the app's system-flexible custom character fields and user-provided external links.

This is a product-engineering assessment, not legal advice.

## Why Open5e V2

Open5e V2 is the better fit for this app because it:

- actively supports both the 2014 SRD (`srd-2014`, SRD 5.1) and the 2024 rules SRD (`srd-2024`, SRD 5.2);
- exposes source-document metadata with each resource;
- supports filtering resource endpoints by document;
- provides spells, creatures, items, magic items, rules, classes, feats, and related resources through one API shape;
- requires no application token; and
- is actively maintained while its V1 API is deprecated.

The D&D 5e SRD API remains a reasonable fallback. It is open, requires no authentication, exposes editioned REST endpoints, and currently includes a 2024 spell collection. Open5e wins because its document metadata and cross-edition model make attribution and source control clearer for a mixed-edition family app.

Primary references:

- [Open5e API V2 documentation](https://open5e.com/api-docs)
- [Open5e API repository and V2 status](https://github.com/open5e/open5e-api)
- [D&D 5e SRD API documentation](https://docs.dnd5eapi.co/)
- [Wizards SRD 5.1 and 5.2.1 licensing page](https://www.dndbeyond.com/srd)

## Content and licensing boundaries

### D&D SRD 5.1 and 5.2

Wizards publishes SRD 5.1 and SRD 5.2 under Creative Commons Attribution 4.0. The app may display and adapt that material if it includes the attribution required by each SRD. SRD 5.1 represents the 2014 5e rules family; SRD 5.2 represents the revised 2024/5.5e rules family.

Implementation requirements:

- Show the source edition on every result and detail view.
- Include the applicable Wizards attribution and a CC BY 4.0 link on the rules-reference screen.
- Preserve Open5e's document key and source metadata in the normalized response.
- Do not imply endorsement by Wizards or use protected logos/trade dress.
- Display only content returned from `srd-2014` or `srd-2024` in the initial release.

### Open5e content

Open5e is a library containing multiple publishers and licenses. Its software license does not grant blanket rights to all included rules or images; licensing is attached to source documents. Therefore the app must not expose Open5e's complete catalog by default.

The global `/v2/search/` endpoint was tested and currently ignores `document__key__in` for this use case. Do not use it. Query resource-specific endpoints such as `/v2/spells/` and `/v2/creatures/`, pass `document__key__in=srd-2014,srd-2024`, and verify every returned record's `document.key` server-side before returning it to the browser.

Do not display Open5e artwork in the initial release. Artwork can have licensing terms different from the rules text.

### Symbaroum and Ruins of Symbaroum

Free League's 2026 Symbaroum third-party license permits tabletop supplements and VTT modules under specific conditions, but expressly excludes video games and does not allow copying the core rules. That is not a clean basis for reproducing Symbaroum rules in this web app.

Ruins of Symbaroum products use 5e/OGL foundations, but that does not make all setting-specific classes, creatures, lore, or text freely reusable. Only material expressly designated as open content could be considered, with the OGL notice and other obligations. The safer initial scope is:

- use SRD 5.1/5.2 rules lookup for general 5e concepts;
- keep Symbaroum-specific values as user-entered campaign/character fields;
- allow links to the players' legally obtained rulebooks or official pages; and
- do not reproduce Symbaroum rules, setting text, artwork, classes, creatures, or powers.

Primary references:

- [Free League open game licenses](https://freeleaguepublishing.com/community-content/free-tabletop-licenses/)
- [Symbaroum Third-Party Tabletop Module License](https://freeleaguepublishing.com/wp-content/uploads/2026/03/Symbaroum-License-Agreement-version-1.0.pdf)
- [Ruins of Symbaroum product and rules overview](https://freeleaguepublishing.com/games/ruins-of-symbaroum/)

## Recommended first release

Build a small, optional reference drawer or page with:

1. A required edition selector: **2014 SRD** or **2024 SRD**.
2. Resource tabs for **spells**, **creatures**, **equipment**, and **rules**.
3. Debounced name search and basic type-specific filters.
4. A detail view with source edition, attribution, and a link to the source/license.
5. No write-back into character sheets and no automated rules calculations.
6. A clear unavailable state that never blocks campaigns, characters, or adventure logs.

## Technical guardrails

- Proxy Open5e through `/api/rules/*`; do not couple Vue views directly to provider response shapes.
- Use explicit TypeScript domain entities and a repository interface.
- Allowlist resource types and the two SRD document keys in the server function.
- Validate every provider response before returning it.
- Use a short timeout, cache successful GET responses, and never retry indefinitely.
- Treat provider HTML/Markdown as untrusted; render sanitized plain text or a restricted Markdown subset.
- Unit-test mapping, allowlist enforcement, provider errors, timeouts, and malformed responses.
- E2E-test both successful lookup and provider-unavailable behavior.

## Revisit later

- Whether the group actually needs both editions after observing campaign usage.
- Whether any non-Wizards Open5e source is worth a separate, source-specific license review.
- Whether a publisher-approved Symbaroum digital reference becomes available.
