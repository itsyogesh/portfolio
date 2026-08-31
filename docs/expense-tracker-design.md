# Expense Tracker -- Design Document

**Date:** 2026-03-05
**Status:** Draft — deferred, tracked separately
**Stack:** Next.js 16 / React 19 / Tailwind 4 / Prisma + Neon PostgreSQL / shadcn/ui

---

## 1. Overview

A standalone expense tracking system for managing business and project expenses across multiple companies. Supports manual entry, CSV import from bank/card exports, AI-powered PDF receipt extraction, and comprehensive reporting. Designed as an independent feature module within the backstage admin app.

**Key design principles:**
- Owner-only access (single user) — reuses `requireAdmin()` guard
- All monetary values stored as integers (cents) to avoid floating-point errors
- Every expense links to a project, every project links to a company
- Import provenance always preserved (which batch, which source, original raw data)

---

## 2. Data Model

### Entity Relationships

```
Company 1---* Project 1---* Expense *---1 ExpenseCategory
                                |
                          0..1--Receipt
                          *..1--ImportBatch
```

### Models

**Company**
- `id`, `name` (unique), `slug` (unique), `color`, `isActive` (soft-delete), timestamps
- Has many Projects

**Project**
- `id`, `name`, `slug`, `companyId` (FK), `color`, `budget` (cents, optional), `isActive`, timestamps
- `@@unique([companyId, slug])`

**ExpenseCategory**
- `id`, `name` (unique), `slug` (unique), `icon` (Lucide name), `color`, timestamps
- Seed defaults: Software & SaaS, Hardware, Travel, Meals, Office Supplies, Professional Services, Advertising, Hosting & Infrastructure, Miscellaneous

**Expense**
- `id`, `amount` (cents), `currency` (ISO 4217, default "USD"), `description`, `notes`, `date`, `merchant`
- `categoryId` (FK), `projectId` (FK), `source` (MANUAL/CSV_IMPORT/PDF_IMPORT/PLAID)
- `importBatchId` (FK, nullable), `receiptId` (FK, nullable), `plaidTxnId` (unique, nullable)
- `isRecurring`, `tags[]`, timestamps
- Indexes: `date`, `projectId`, `categoryId`, `importBatchId`

**ImportBatch**
- `id`, `source` (CSV/PDF/PLAID), `fileName`, `status` (PENDING/PROCESSING/COMPLETED/FAILED)
- `totalRows`, `importedCount`, `skippedCount`, `errorCount`
- `columnMapping` (JSON), `rawData` (JSON), `errors` (JSON)
- timestamps + `completedAt`

**Receipt**
- `id`, `fileName`, `fileUrl` (Vercel Blob), `fileSize`, `mimeType`
- `extractedData` (JSON), `confidence` (0.0-1.0), `status` (UPLOADED/PROCESSING/EXTRACTED/FAILED)
- timestamps

**PlaidConnection** (future)
- `id`, `institutionId`, `institutionName`, `accessToken` (encrypted), `itemId`
- `accountIds[]`, `cursor`, `lastSyncedAt`, `status`, `defaultProjectId` (FK)
- timestamps

---

## 3. CSV Import

**Flow:** Upload → Preview (10 rows) → Column Mapping → Validation → Duplicate Check → Confirm → Import

**Column mapping:** Auto-detect common aliases (amount, date, description, merchant), manual override via dropdowns, save mapping templates for reuse.

**Duplicate detection:** Composite key `(date, amount, description)` — exact match = likely duplicate, partial `(date, amount)` = possible duplicate shown for user decision.

**Batch processing:** Default project + category per batch, individual row overrides in preview. Single transaction, rollback on any failure.

---

## 4. PDF Receipt Import

**Flow:** Upload PDF/Image → Store in Vercel Blob → OpenAI gpt-4o vision extraction → Show results with confidence scores → User confirms/edits → Create expense

**Extracted fields:** merchant, date, amount, tax, subtotal, currency, lineItems[], paymentMethod, category guess

**Confidence tiers:** High (>=0.9, green, one-click), Medium (0.6-0.9, yellow, review), Low (<0.6, red, manual verify)

---

## 5. Plaid Integration (Future)

- Plaid Link for bank auth, `transactions/sync` for incremental fetching
- Encrypted access_token storage (AES-256-GCM)
- 6-hour sync interval via Vercel Cron
- Merchant-to-project mapping rules + AI categorization for unmatched
- Review queue for unconfident assignments

---

## 6. Reporting

**Dashboard:** Total spend (month/YTD), burn rate trend (12mo line chart), top 5 categories (bar), recent expenses

**Reports:**
- Category breakdown (pie + bar + table)
- Project reports (bar + budget vs actual progress bars)
- Company reports (bar + nested drill-down)
- Monthly trends (line chart, period comparison)

**Filters (global):** Date range, company, project, category, source, tags, amount range — persisted in URL params

**Export:** CSV download of any filtered view via streaming API route

**Charts:** Recharts via shadcn/ui charts (already available)

---

## 7. Pages

```
/expenses                          Dashboard overview
/expenses/new                      Manual entry form
/expenses/[id]                     Detail / edit
/expenses/list                     Full list with filters, sort, pagination
/expenses/import                   Import hub (CSV or PDF)
/expenses/import/csv               Upload + mapping + preview
/expenses/import/pdf               Receipt upload + AI extraction
/expenses/import/history           Batch history
/expenses/import/[batchId]         Batch detail
/expenses/reports                  Reports hub
/expenses/reports/categories       Category breakdown
/expenses/reports/projects         Project reports
/expenses/reports/companies        Company reports
/expenses/reports/trends           Monthly trends
/expenses/settings                 Manage companies, projects, categories
/expenses/settings/companies       CRUD companies
/expenses/settings/projects        CRUD projects
/expenses/settings/categories      CRUD categories
/expenses/settings/plaid           (Future) Plaid connections
```

---

## 8. API Routes

All under `/api/expenses`, protected by `requireAdmin()`.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/expenses` | GET, POST | List (filtered), Create |
| `/api/expenses/[id]` | GET, PATCH, DELETE | Single CRUD |
| `/api/expenses/export` | GET | CSV export |
| `/api/expenses/import/csv` | POST | Upload + import |
| `/api/expenses/import/csv/preview` | POST | Parse + preview |
| `/api/expenses/import/pdf` | POST | Upload receipt |
| `/api/expenses/import/pdf/extract` | POST | Trigger AI extraction |
| `/api/expenses/import/batches` | GET | List batches |
| `/api/expenses/import/batches/[id]` | GET | Batch detail |
| `/api/expenses/reports/summary` | GET | KPI totals |
| `/api/expenses/reports/by-category` | GET | Category aggregation |
| `/api/expenses/reports/by-project` | GET | Project aggregation |
| `/api/expenses/reports/by-company` | GET | Company aggregation |
| `/api/expenses/reports/trends` | GET | Monthly trends |
| `/api/expenses/companies` | GET, POST | List, Create |
| `/api/expenses/companies/[id]` | PATCH, DELETE | Update, Soft-delete |
| `/api/expenses/projects` | GET, POST | List, Create |
| `/api/expenses/projects/[id]` | PATCH, DELETE | Update, Soft-delete |
| `/api/expenses/categories` | GET, POST | List, Create |
| `/api/expenses/categories/[id]` | PATCH, DELETE | Update, Delete |

---

## 9. Implementation Phases

| Phase | Scope | Timeline |
|-------|-------|----------|
| 1 | Foundation: schema, settings CRUD, manual entry, expense list | Week 1 |
| 2 | Reporting: dashboard, charts, filters, CSV export | Week 2 |
| 3 | CSV Import: upload, column mapping, dedup, batch tracking | Week 3 |
| 4 | PDF Receipt: Vercel Blob storage, OpenAI extraction, confirm flow | Week 4 |
| 5 | Plaid: Link integration, sync, merchant mapping, review queue | Future |

---

## 10. Open Questions

1. Multi-currency — schema supports it, but Phase 1 assumes USD-only
2. Tax categories — add deductible/non-deductible enum on ExpenseCategory?
3. Recurring expense detection — auto-detect patterns?
4. Mobile receipt capture — camera → crop → upload flow?
5. Shared access — bookkeeper/accountant role?
