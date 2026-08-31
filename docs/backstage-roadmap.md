# Owner Console Roadmap

Last reviewed: 2026-08-10

This document records portfolio features that fit the owner console after the first release. The internal application is currently named Backstage; choose a distinct public product name before promoting it as a standalone open-source product.

## Product Principle

Integrations should enrich the public portfolio without making it dependent on third-party APIs at request time.

- Sync provider data in the background.
- Store a small normalized snapshot in PostgreSQL.
- Render public pages from the database cache.
- Give the owner explicit visibility and privacy controls.
- Degrade gracefully when a provider is unavailable.
- Keep tokens encrypted and never expose them to the browser.

## Priority 1: Spotify

### Public Experience

- “Now playing” card with artwork, track, artist, progress, and Spotify link
- Recently played strip
- Top artists and tracks over short, medium, and long periods
- Optional music page with listening summaries
- Hidden, delayed, or aggregate-only modes for privacy

### Owner Experience

- Connect or disconnect Spotify
- Choose which modules are public
- Configure recent-history delay
- Pin favorite albums, tracks, or playlists
- View last successful sync and provider errors

### Architecture

1. Use Spotify's Authorization Code flow on the server.
2. Request only the scopes required by enabled modules, such as `user-read-currently-playing`, `user-read-recently-played`, and `user-top-read`.
3. Store access and refresh tokens in an encrypted generalized connection record.
4. Normalize provider results into cached snapshots rather than proxying Spotify on every page request.
5. Refresh now-playing data on a short interval and history/top data much less frequently.
6. Respect `429` responses and `Retry-After`.
7. Include required Spotify attribution and outbound links.

Spotify's authorization and endpoint references should be checked again during implementation because its Web API access rules changed in 2026:

- [Spotify authorization](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Recently played endpoint](https://developer.spotify.com/documentation/web-api/reference/get-recently-played)
- [Top items endpoint](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks)
- [February 2026 API changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026)

### Suggested Data

- `IntegrationConnection`: provider, providerAccountId, encryptedAccessToken, encryptedRefreshToken, scopes, expiresAt, status, lastSyncedAt, lastError
- `MusicSnapshot`: kind, providerId, payload, capturedAt, expiresAt, isPublic
- `PinnedMusicItem`: providerId, type, title, artist, imageUrl, externalUrl, position

Generalizing connections first avoids separate token storage implementations for GitHub, Google, and Spotify.

## Priority 2: Books and Reading

Do not make a new Goodreads API integration the foundation. Goodreads stopped issuing new public API keys and announced API retirement, so a fresh OAuth integration is not a dependable path: [Goodreads API deprecation announcement](https://www.goodreads.com/topic/show/21788520-api-deprecation?tab=author).

### Recommended Approach

- Native `Book` and `ReadingStatus` models managed in the owner console
- Goodreads CSV import for owners who can export their library
- Manual add/edit as the reliable baseline
- Optional low-volume Open Library enrichment for ISBN metadata and covers
- Source fields so imported records can be refreshed or deduplicated
- Public “Currently reading”, “Recently finished”, favorites, and yearly reading pages
- Private notes and ratings separated from public reviews

Open Library asks clients to identify requests, cache responses, and stay within published rate guidance: [Open Library APIs](https://openlibrary.org/developers/api).

### Suggested Data

- `Book`: isbn10, isbn13, title, authors, coverUrl, source, sourceId
- `ReadingEntry`: bookId, status, startedAt, finishedAt, rating, review, notes, isPublic
- `ReadingList`: name, description, position
- `ReadingListItem`: listId, bookId, position

## Priority 3: High-Value Portfolio Modules

### Now Page

A short, dated update covering what the owner is building, learning, reading, and exploring. Keep historical snapshots for a public archive.

### Uses and Gear

Hardware, software, desk setup, services, and development tools. Reuse stack-style categories but keep endorsements and affiliate disclosure explicit.

### Speaking and Appearances

Talks, podcasts, workshops, livestreams, and interviews with event, date, recording, slides, and host information.

### Activity Feed

A curated chronological feed combining shipped projects, articles, releases, talks, books, and selected GitHub activity. Prefer editorial curation over an unfiltered firehose.

### Testimonials

Short recommendations tied to a person and organization, with explicit permission and an optional source URL.

### Changelog

Public project updates and launch notes. This can feed the home page, project pages, RSS, and social sharing.

### Newsletter

Newsletter signup and issue archive. Start with an external provider link or embed; avoid storing subscriber data until consent, unsubscribe, and delivery operations are designed.

### Webmentions and Guestbook

Add social proof and conversation without building a full social network. Require moderation, spam controls, and an abuse-report path.

### Photos and Travel

Selected photo journals or a map of places worked from. Never publish live location, precise home location, or sensitive EXIF data.

### Public Analytics

Optional privacy-friendly stats such as article reads, project clicks, countries, referrers, and popular bookmarks. Keep raw visitor identity out of the public product.

### Import, Export, and Backups

For an open-source portfolio platform, portability is a core feature:

- Full JSON export of structured portfolio data
- MDX export or repository sync for writing
- Encrypted integration-secret backup excluded by default
- Import preview with validation and conflict resolution
- JSON Resume import and export

## Delivery Order

1. Ship and stabilize the current portfolio and owner console.
2. Rename the public product and add a license.
3. Generalize provider connections and encrypted token handling.
4. Build native books/reading with CSV import.
5. Add Spotify snapshots and privacy controls.
6. Add Now, Uses, Speaking, and Changelog modules.
7. Add activity aggregation only after each source has reliable caching.
8. Add import/export, backups, and fork onboarding before a wider open-source launch.

## Integration Definition of Done

- Provider tokens are server-only and encrypted at rest.
- Disconnect revokes or deletes credentials and stops future syncs.
- Every public module has an owner-controlled visibility setting.
- Public rendering does not require a live provider response.
- Sync jobs are idempotent, observable, and safe after partial failures.
- Provider attribution, branding, and API terms are followed.
- Empty, disconnected, rate-limited, and expired-token states have deliberate UI.
- Data export and deletion behavior is documented.
