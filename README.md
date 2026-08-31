# itsyogesh.fyi

A database-driven personal portfolio with a private owner console. The public site presents projects, writing, work history, education, accolades, tools, bookmarks, GitHub stars, and scheduling. The owner console manages structured content while long-form articles remain in MDX.

## Release Status

This repository is preparing for its first public release. It does not currently include a software license, so it should not be advertised as open source until a license is selected and committed. See [the release checklist](docs/release-checklist.md) for the remaining launch decisions.

## Applications

| Application | Local URL | Purpose |
| --- | --- | --- |
| Web | http://localhost:4000 | Public portfolio |
| Backstage | http://localhost:4001 | Owner-only content and calendar console |

The repository calls the admin application Backstage internally. Before publishing it as a standalone product, choose a distinct public name to avoid confusion with the existing [Backstage developer portal](https://backstage.io/).

## Features

- Fully database-driven identity, projects, experience, education, accolades, stack, timeline, external writing, GitHub stars, and bookmarks
- MDX-backed long-form articles
- Owner-only Better Auth access with optional GitHub OAuth
- GitHub stars synchronization with list assignments and soft unstar handling
- Google Calendar synchronization and public scheduling
- Dynamic metadata, sitemap, robots rules, and structured data
- Shared UI, database, auth, calendar, CMS, AI, and SEO packages

## Architecture

This is a pnpm and Turborepo monorepo using Next.js 16 and React 19.

| Path | Responsibility |
| --- | --- |
| `apps/web` | Public portfolio |
| `apps/backstage` | Private owner console |
| `packages/db` | Prisma schema, generated client, and Neon adapter |
| `packages/auth` | Better Auth server and client |
| `packages/calendar` | Google Calendar OAuth, sync, availability, and booking |
| `packages/cms` | Content Collections configuration for MDX |
| `packages/base` | Shared components, styles, and utilities |
| `packages/seo` | Shared metadata and structured-data helpers |
| `content` | MDX articles and source content used by initial seeding |
| `scripts` | Owner/content seeding, GitHub sync, and bookmark tools |

Structured content lives in PostgreSQL. Articles in `content/articles` remain MDX. External articles, threads, and posts are stored as `ExternalWriting` records and merged into the public writing feed.

## Prerequisites

- Node.js 20.9 or newer
- pnpm 10.11
- PostgreSQL, with Neon supported out of the box
- Optional GitHub, Google Calendar, and OpenAI credentials

## Local Setup

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Copy and fill the environment templates.

   ```bash
   cp .env.example .env.local
   cp apps/web/.env.example apps/web/.env.local
   cp apps/backstage/.env.example apps/backstage/.env.local
   ```

3. Apply committed database migrations.

   ```bash
   pnpm db:migrate:deploy
   ```

4. Seed initial portfolio content if the database is empty.

   ```bash
   pnpm seed:content
   ```

5. Start both applications.

   ```bash
   pnpm dev
   ```

### Bootstrap the Owner

The sign-up endpoint is disabled unless `ALLOW_SIGN_UP=true`. For a new installation:

1. Start Backstage with `ALLOW_SIGN_UP=true`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME`, and `APP_URL` configured.
2. Run `pnpm seed:owner`.
3. Remove or set `ALLOW_SIGN_UP=false`.
4. Restart or redeploy Backstage.

Every dashboard page and mutation endpoint independently checks that the signed-in email matches `OWNER_EMAIL`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run both applications |
| `pnpm build` | Build the monorepo |
| `pnpm lint` | Run Biome lint checks |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm db:migrate:deploy` | Apply committed migrations |
| `pnpm db:migrate:status` | Inspect migration status |
| `pnpm seed:content` | Upsert initial portfolio content |
| `pnpm seed:owner` | Create the single owner account |
| `pnpm stars:sync` | Synchronize GitHub stars |

## Deployment

Production uses two Vercel projects from this monorepo:

- `apps/web` -> `itsyogesh.fyi`
- `apps/backstage` -> `backstage.itsyogesh.fyi`

Do not share all environment variables indiscriminately between the projects. Backstage requires auth and owner settings; the public web app should receive only the database and calendar values it needs. Follow [docs/release-checklist.md](docs/release-checklist.md) for the environment matrix, migration order, DNS cutover, security controls, and smoke tests.

## Future Work

Spotify, books, reading history, activity, and other portfolio integrations are scoped in [docs/backstage-roadmap.md](docs/backstage-roadmap.md).

## License

No license has been selected yet. Add a license before inviting third-party use, modification, or distribution.
