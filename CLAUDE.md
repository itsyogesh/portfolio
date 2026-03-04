# Project

Personal portfolio monorepo for itsyogesh.fyi. Two Next.js 16 apps (public site + admin dashboard), shared packages, PostgreSQL via Neon. Designed to be forked as a self-hosted portfolio platform.

# Structure

- `apps/web/` — Public portfolio site (port 3000)
- `apps/backstage/` — Owner-only admin dashboard (port 3001)
- `packages/db/` — Prisma ORM + Neon serverless adapter, all models
- `packages/auth/` — Better Auth (email/password + optional GitHub OAuth)
- `packages/cms/` — content-collections for MDX articles/projects
- `packages/seo/` — Metadata helper and JSON-LD component
- `packages/base/` — shadcn/ui components, theme, fonts, utilities
- `packages/ai/` — OpenAI integration for bookmark processing
- `content/` — MDX articles and projects, stack.json, timeline.json
- `scripts/` — Seed, sync, and bookmark processing CLI scripts
- `tooling/` — Shared TypeScript and Next.js configs

# Commands

- `pnpm dev` — Start both apps (web:3000, backstage:3001)
- `pnpm build` — Build all packages and apps
- `pnpm dev --filter=web` — Start only the public site
- `pnpm dev --filter=backstage` — Start only the admin
- `cd packages/db && pnpm db:push` — Push schema changes to DB
- `cd packages/db && pnpm db:migrate` — Create and run migrations
- `cd packages/db && pnpm db:studio` — Open Prisma Studio
- `pnpm seed:content` — Seed profile, projects, stack, timeline from files
- `pnpm stars:sync` — Sync GitHub starred repos to DB

# Architecture

- All structured content is DB-driven (Profile, Projects, Stack, Timeline, Stars, etc.)
- Blog articles stay as MDX files managed by content-collections
- Public site reads all identity (name, socials, bio) from the Profile DB table
- Backstage auth uses OWNER_EMAIL env var for single-owner access control
- `requireAdmin()` guards API routes (returns JSON errors)
- `requireAdminPage()` guards server components (redirects to /sign-in)
- Singleton Profile pattern: `id @default("owner")`, upsert by fixed ID
- Stars use soft-cleanup (isStarred + unstarredAt) to preserve list assignments

# Gotchas

- Backstage does NOT use content-collections/CMS — the virtual module fails in Turbopack builds. Writing page uses filesystem-based MDX reading instead.
- The FS path for MDX in backstage (`../../content/articles`) is fragile. Set `CONTENT_DIR` env var for deployment.
- `packages/db/generated/` is gitignored — run `pnpm build` in packages/db or `pnpm install` (triggers postinstall) to generate the Prisma client.
- DB was bootstrapped with `db:push`. Baseline migration exists at `prisma/migrations/0_init/`. Use `prisma migrate dev` for future changes.
- GitHub OAuth config in packages/auth/server.ts is conditional — only activates when both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set.
- `apps/web/app/components/header.tsx` is a client component — pass data via props from server layout, don't import DB directly.

# Env Vars

See `.env.example` files in root, `apps/web/`, and `apps/backstage/` for required variables. Critical ones:
- `DATABASE_URL` / `DIRECT_URL` — Neon PostgreSQL connection strings
- `BETTER_AUTH_SECRET` — Auth session signing
- `OWNER_EMAIL` — Backstage access control (backstage only)
