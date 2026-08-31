# Release Checklist

Last reviewed: 2026-08-10

This checklist covers the public portfolio at `itsyogesh.fyi` and the owner console at `backstage.itsyogesh.fyi`.

## Release Decision

The personal portfolio and owner console are live. These items still need to be resolved before announcing the repository as an open-source platform:

- [ ] Choose a distinct public product name. Backstage is already the CNCF-hosted developer portal created at Spotify. The internal route and subdomain can remain `backstage`, but public “Powered by Backstage” branding would be confusing.
- [ ] Select and commit a software license. Without one, the repository is source-visible rather than open source.
- [x] Keep extracted third-party article bodies private. Public bookmark pages show the title, source, summary, and outbound link only.
- [x] Configure production environment variables in both Vercel projects.
- [x] Apply the committed release-hardening migration to the current Neon database and verify migration status.
- [ ] Add a Vercel WAF rate-limit rule for public booking requests before activating an event type.
- [x] Complete the domain cutover and unauthenticated production smoke tests below.

## Automated Verification

Run from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm db:migrate:status
pnpm audit --prod --audit-level high
```

GitHub Actions runs lint and type-checking without production secrets. Builds remain a deployment check because both Next.js applications need database-backed data during route generation.

Current audit baseline: zero critical or high production advisories. One moderate `uuid` advisory remains inside the MDX build toolchain; it is not used by request-time application code.

## Vercel Projects

Create two projects from the same GitHub repository. Vercel supports selecting separate root directories for each app in a monorepo: [Vercel monorepo documentation](https://vercel.com/docs/monorepos).

| Project | Root directory | Production domain |
| --- | --- | --- |
| Public portfolio | `apps/web` | `itsyogesh.fyi` |
| Owner console | `apps/backstage` | `backstage.itsyogesh.fyi` |

Use Node.js 22 and the repository's pinned pnpm version. Keep “Include source files outside the Root Directory” enabled so workspace packages and `content` are available.

## Production Environment

### Public Portfolio

| Variable | Required | Production value or purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Recommended | Neon direct connection for operational commands |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://itsyogesh.fyi` |
| `GOOGLE_CLIENT_ID` | For scheduling | Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | For scheduling | Google OAuth secret |
| `CALENDAR_ENCRYPTION_KEY` | For scheduling | Same 32-byte hex key used by Backstage |

### Owner Console

| Variable | Required | Production value or purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Recommended | Neon direct connection |
| `BETTER_AUTH_SECRET` | Yes | Random secret of at least 32 characters |
| `BETTER_AUTH_URL` | Yes | `https://backstage.itsyogesh.fyi` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://backstage.itsyogesh.fyi` |
| `APP_URL` | Bootstrap only | `https://backstage.itsyogesh.fyi` |
| `OWNER_EMAIL` | Yes | Exact owner sign-in email |
| `ALLOW_SIGN_UP` | Yes | `false` or unset after bootstrap |
| `NEXT_PUBLIC_WEB_URL` | Yes | `https://itsyogesh.fyi` |
| `CONTENT_DIR` | Recommended | Absolute deployed content root if filesystem discovery fails |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth application |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth secret |
| `GITHUB_USERNAME` | For stars sync | GitHub username fallback |
| `GITHUB_TOKEN` | Recommended | Token for reliable star synchronization |
| `GOOGLE_CLIENT_ID` | For calendar | Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | For calendar | Google OAuth secret |
| `GOOGLE_REDIRECT_URI` | For calendar | `https://backstage.itsyogesh.fyi/api/calendar/callback` |
| `CALENDAR_ENCRYPTION_KEY` | For calendar | 32-byte hex encryption key |
| `OPENAI_API_KEY` | Optional | Bookmark processing |

Do not set `ALLOW_SIGN_UP=true` in the steady-state production environment. Vercel exposes production URL system variables, but canonical and auth URLs should still be explicit: [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables).

## Database Rollout

1. Back up or branch the Neon production database.
2. Confirm `DIRECT_URL` targets the intended production database.
3. Apply committed migrations:

   ```bash
   pnpm db:migrate:deploy
   ```

4. Verify:

   ```bash
   pnpm db:migrate:status
   ```

5. Run `pnpm seed:content` only for a new or intentionally refreshed installation.
6. Run `pnpm stars:sync` after the profile GitHub link or `GITHUB_USERNAME` is configured.

Never use `prisma db push` as the production release path.

## Authentication Checks

- [x] Anonymous dashboard navigation redirects to `/sign-in`.
- [x] Anonymous API mutations return JSON `401`, not HTML redirects.
- [ ] A non-owner session receives `403` from mutation endpoints.
- [ ] The owner can sign in and sign out.
- [ ] `POST /api/auth/sign-up/email` cannot create another account after bootstrap.
- [x] Backstage responses include `X-Robots-Tag: noindex, nofollow, noarchive`.
- [x] `/robots.txt` disallows crawling the entire Backstage host.

## Scheduling Protection

The application validates payloads, origins, idempotency keys, availability, and recent database booking volume. Add edge protection as a second layer:

- Rate-limit `POST /api/schedule/*/book` by IP.
- Start around five requests per minute per IP and tune from observed traffic.
- Enable bot protection or a challenge if abuse appears.
- Alert on booking spikes and Google API failures.

Vercel documents WAF-based rate limiting here: [Vercel rate-limiting guidance](https://vercel.com/kb/guide/add-rate-limiting-vercel).

## Domain Cutover

Cutover completed on 2026-08-10. GoDaddy remains the authoritative DNS host.

- [x] Deploy and smoke-test both Vercel projects.
- [x] Route `itsyogesh.fyi` and `www.itsyogesh.fyi` to the public project.
- [x] Route `backstage.itsyogesh.fyi` to the owner-console project.
- [x] Route `itsyogesh.in` and `www.itsyogesh.in` to the public project.
- [x] Redirect both `www` hosts and both `.in` hosts to `https://itsyogesh.fyi` with HTTP 308.
- [x] Replace GoDaddy parking records with Vercel DNS records.
- [x] Issue and verify HTTPS certificates for all five hostnames.

Follow Vercel's current domain instructions rather than copying stale A or CNAME values: [Vercel custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain).

## Public Smoke Tests

- [x] Home page renders the database profile and featured projects.
- [x] Header, footer, metadata, canonical URL, and structured data use the owner profile.
- [x] Projects list and representative project detail routes render.
- [x] About, stack, stars, bookmarks, and writing render.
- [ ] External writing opens the original source.
- [ ] Private bookmarks do not appear in lists, detail pages, metadata, or sitemap.
- [x] `/robots.txt` references the production sitemap.
- [x] `/sitemap.xml` contains MDX writing and database projects; there are currently no active schedule routes.
- [ ] A scheduling slot can be reserved once and duplicate submission is idempotent.
- [ ] Booking confirmation URLs contain no name, email, or appointment details.
- [ ] Mobile navigation and core pages are usable at 375px width.

## Owner Console Smoke Tests

- [ ] Dashboard counts match the database.
- [ ] Profile and social edits appear on the public site within the cache window.
- [ ] Project create, edit, slug navigation, and delete work.
- [ ] Organization, work, education, accolade, stack, and timeline CRUD work.
- [ ] GitHub star sync completes without partially un-starring records after an API error.
- [ ] Star list drag-and-drop persists after refresh.
- [ ] MDX and external writing both appear.
- [ ] Google connection, calendar sync, event editing, and event type links use the public domain.

## Rollback

- Keep the GoDaddy DNS values recorded before changing them.
- Retain the previous successful Vercel deployment for each project.
- If the release fails, roll back both Vercel projects first, then restore DNS only if routing itself is broken.
- Treat database migrations as forward-only. Create a corrective migration rather than modifying an applied migration.
