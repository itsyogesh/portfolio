-- CreateTable
CREATE TABLE "google_account" (
    "id" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "displayName" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "color" TEXT NOT NULL DEFAULT '#4285f4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_calendar" (
    "id" TEXT NOT NULL,
    "googleCalendarId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "color" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "accessRole" TEXT NOT NULL DEFAULT 'reader',
    "syncToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "googleAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_cache" (
    "id" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "htmlLink" TEXT,
    "calendarId" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_event_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "minNotice" INTEGER NOT NULL DEFAULT 60,
    "maxFutureDays" INTEGER NOT NULL DEFAULT 60,
    "availability" JSONB NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "targetCalendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type_check_calendar" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,

    CONSTRAINT "event_type_check_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "eventTypeId" TEXT NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerEmail" TEXT NOT NULL,
    "bookerTimezone" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "googleEventId" TEXT,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "targetCalendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_account_googleAccountId_key" ON "google_account"("googleAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_googleAccountId_googleCalendarId_key" ON "google_calendar"("googleAccountId", "googleCalendarId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_cache_calendarId_googleEventId_key" ON "calendar_event_cache"("calendarId", "googleEventId");

-- CreateIndex
CREATE INDEX "calendar_event_cache_startTime_idx" ON "calendar_event_cache"("startTime");

-- CreateIndex
CREATE INDEX "calendar_event_cache_endTime_idx" ON "calendar_event_cache"("endTime");

-- CreateIndex
CREATE INDEX "calendar_event_cache_calendarId_idx" ON "calendar_event_cache"("calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_slug_key" ON "event_type"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_check_calendar_eventTypeId_calendarId_key" ON "event_type_check_calendar"("eventTypeId", "calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_idempotencyKey_key" ON "booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "booking_eventTypeId_idx" ON "booking"("eventTypeId");

-- CreateIndex
CREATE INDEX "booking_startTime_idx" ON "booking"("startTime");

-- CreateIndex
CREATE INDEX "booking_bookerEmail_idx" ON "booking"("bookerEmail");

-- AddForeignKey
ALTER TABLE "google_calendar" ADD CONSTRAINT "google_calendar_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "google_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_cache" ADD CONSTRAINT "calendar_event_cache_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "google_calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_cache" ADD CONSTRAINT "calendar_event_cache_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "google_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type" ADD CONSTRAINT "event_type_targetCalendarId_fkey" FOREIGN KEY ("targetCalendarId") REFERENCES "google_calendar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_check_calendar" ADD CONSTRAINT "event_type_check_calendar_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_check_calendar" ADD CONSTRAINT "event_type_check_calendar_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "google_calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping bookings on the same target calendar.
-- Uses COALESCE so:
--   - if targetCalendarId is set: groups by calendar (catches cross-event-type overlaps)
--   - if targetCalendarId is null: falls back to eventTypeId
-- Uses half-open range [) so back-to-back slots (e.g. 9:00-9:30, 9:30-10:00) are allowed.
-- Only applies to pending or confirmed bookings (cancelled bookings are ignored).
ALTER TABLE "booking" ADD CONSTRAINT "no_overlapping_bookings"
EXCLUDE USING GIST (
  COALESCE("targetCalendarId", "eventTypeId") WITH =,
  tsrange("startTime", "endTime", '[)') WITH &&
)
WHERE ("status" IN ('pending', 'confirmed'));
