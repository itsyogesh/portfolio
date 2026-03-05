# Backstage — Admin Dashboard (port 3001)

Next.js 16 with App Router, React 19, Tailwind 4. Owner-only admin for managing all portfolio content.

# Route Groups

- `app/(auth)/` — Sign-in page. Centered layout, no sidebar.
- `app/(dashboard)/` — All admin pages. Sidebar + header layout.
- `app/layout.tsx` — Bare shell: html/body/BaseProvider only.
- API routes stay at `app/api/` (not inside route groups).

# Auth

- `app/api/_lib/auth.ts` — Two guards:
  - `requireAdmin()` — For API routes. Checks session + OWNER_EMAIL. Returns JSON 401/403/500.
  - `requireAdminPage()` — For server components. Redirects to /sign-in if unauthorized.
- `proxy.ts` — Middleware that redirects unauthenticated users. Excludes `/sign-in` and `/api/` routes.
- Every page calls `await requireAdminPage()` at the top before any DB query.
- Every API route calls `await requireAdmin()` and checks `if (error) return error`.

# Pages

All under `app/(dashboard)/`.

- `/` — Dashboard with stat cards for all content types
- `/profile` — Edit name, headline, bio, avatar, socials
- `/projects` — CRUD table with form dialog
- `/experience` — Organizations with nested work experiences
- `/education` — CRUD card list
- `/accolades` — CRUD table grouped by type
- `/stack` — Categories with nested items
- `/timeline` — Ordered year-based entries
- `/stars` — Kanban board (drag-and-drop with @hello-pangea/dnd), sync button
- `/writing` — Two tabs: read-only MDX articles + external writing CRUD
- `/bookmarks` — Add, process, search bookmarks
- `/settings/connections` — GitHub OAuth connection status

# API Routes

All under `app/api/`. Pattern: `route.ts` for collection (GET, POST), `[id]/route.ts` for item (GET, PATCH, DELETE).

Nested: `/organizations/[id]/work/route.ts` and `/organizations/[id]/work/[workId]/route.ts`.

Special: `/stars/sync` (POST triggers GitHub sync), `/stars/repos/reorder` (PATCH bulk reorder), `/bookmarks/process` and `/bookmarks/search`.

# CRUD Pattern

Each section follows: server page.tsx (fetches data) + client component forms (dialogs) + API routes.
- Forms use shadcn/ui Dialog, Input, Select, Textarea, Button
- Toast notifications via sonner
- Tables use shadcn/ui Table component

# Gotchas

- Does NOT use content-collections. Writing page reads MDX via filesystem (`node:fs`). Path: `process.env.CONTENT_DIR` or fallback `join(process.cwd(), '..', '..', 'content', 'articles')`.
- Stars kanban uses `@hello-pangea/dnd` (React 19 compatible fork of react-beautiful-dnd).
- Sidebar component is in `app/components/app-sidebar.tsx` (client component). Receives `userEmail` prop from dashboard layout.
- Dashboard layout reads sidebar state from cookies and session from auth.
- Import paths from dashboard pages use `../../api/_lib/auth` (one level deep) or `../../../api/_lib/auth` (two levels deep like settings/connections).
