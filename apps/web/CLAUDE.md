# Web — Public Portfolio (port 3000)

Next.js 16 with App Router, React 19, Tailwind 4. All content is DB-driven except blog articles (MDX via content-collections).

# Pages

- `/` — Home with featured projects
- `/about` — Bio (markdown from Profile.bio), stats (computed from DB counts), timeline
- `/projects` — All projects from DB, grouped by status
- `/projects/[slug]` — Project detail, renders DB `content` field with react-markdown + remark-gfm
- `/writing` — Merged feed: MDX articles (CMS) + ExternalWriting (DB), sorted by date
- `/writing/[slug]` — MDX article detail (CMS only, not DB)
- `/stack` — StackCategory + StackItem from DB
- `/stars` — StarRepo + StarList from DB, grouped by lists then language
- `/bookmarks` — Public bookmarks with filtering and search

# Key Patterns

- `app/lib/profile.ts` — Cached server function `getProfile()` used everywhere for identity
- `app/components/header.tsx` is a **client component** — receives `profileName` as prop from server layout. Do not import DB here.
- `app/components/footer.tsx` is an **async server component** — reads socials directly from DB
- `app/layout.tsx` uses `generateMetadata()` (not static export) to read profile name from DB
- `app/opengraph-image.tsx` reads name/headline/website from Profile DB
- Writing slug pages are MDX only. External writing links out directly (no local pages).
- `content-collections.ts` configures MDX collections. Requires `withCMS()` wrapper in next.config.ts.

# SEO

- `robots.ts` and `sitemap.ts` generate from DB (project slugs) + CMS (article slugs)
- External writing entries are excluded from sitemap
- JSON-LD on writing/[slug] reads author from Profile DB
- `@packages/seo/metadata.ts` accepts `authorName`, `authorUrl`, `twitterHandle` params
