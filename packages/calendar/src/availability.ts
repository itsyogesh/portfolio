import { database } from '@packages/db';
import { listAllEvents } from './google-api';
import { getValidAccessToken } from './token-manager';
import type { AvailabilitySchedule, AvailableSlot, TimeSlot } from './types';

/**
 * Get available booking slots for an event type on a given date.
 *
 * The `date` is a YYYY-MM-DD string representing the day the *booker* selected
 * in their local timezone (`bookerTimezone`). We convert that day into the
 * corresponding host-timezone window so that cross-timezone bookings surface
 * all correct slots (e.g. late-evening host slots that are the next calendar
 * day for the booker).
 */
export async function getAvailableSlots(
  eventTypeId: string,
  date: string, // YYYY-MM-DD in booker's local timezone
  bookerTimezone: string
): Promise<AvailableSlot[]> {
  const eventType = await database.eventType.findUniqueOrThrow({
    where: { id: eventTypeId },
    include: {
      checkCalendars: {
        include: {
          calendar: { include: { googleAccount: true } },
        },
      },
    },
  });

  if (!eventType.isActive) return [];

  const availability = eventType.availability as unknown as AvailabilitySchedule;
  const tz = eventType.timezone;

  // Convert the booker's selected day boundaries to UTC
  const bookerDayStartUTC = parseTimeInTimezone(date, '00:00', bookerTimezone);
  const bookerDayEndUTC = parseTimeInTimezone(
    nextDateStr(date),
    '00:00',
    bookerTimezone
  );

  // Determine which host-timezone day(s) the booker's day spans.
  // The booker's day may cover parts of two host days (e.g. booker in Tokyo
  // selects March 10, but the host in LA is still on March 9 for some hours).
  const hostDays = getHostDaysCoveredByBookerDay(
    bookerDayStartUTC,
    bookerDayEndUTC,
    tz
  );

  // Generate candidate slots for every host day that overlaps
  let candidates: AvailableSlot[] = [];
  for (const hostDate of hostDays) {
    const dayOfWeek = getDayOfWeekInTimezone(hostDate, tz);
    const daySlots = availability[dayOfWeek];
    if (!daySlots || daySlots.length === 0) continue;
    candidates = candidates.concat(
      generateCandidateSlots(hostDate, daySlots, eventType.durationMinutes, tz)
    );
  }

  // Keep only slots whose start falls within the booker's selected day
  candidates = candidates.filter((slot) => {
    const start = new Date(slot.startTime);
    return start >= bookerDayStartUTC && start < bookerDayEndUTC;
  });

  // Apply minNotice filter
  const now = new Date();
  const minNoticeMs = eventType.minNotice * 60 * 1000;
  const earliestStart = new Date(now.getTime() + minNoticeMs);

  // Apply maxFutureDays filter
  const maxFutureDate = new Date();
  maxFutureDate.setDate(maxFutureDate.getDate() + eventType.maxFutureDays);

  const filtered = candidates.filter((slot) => {
    const start = new Date(slot.startTime);
    return start >= earliestStart && start <= maxFutureDate;
  });

  if (filtered.length === 0) return [];

  // Fetch busy times — use the booker's full day window (already in UTC)
  const dayStartISO = bookerDayStartUTC.toISOString();
  const dayEndISO = bookerDayEndUTC.toISOString();

  const busyTimes = await fetchBusyTimes(
    eventType.checkCalendars,
    dayStartISO,
    dayEndISO,
    tz
  );

  // Also check existing bookings — use overlapping range check, not fully-contained
  const existingBookings = await database.booking.findMany({
    where: {
      eventTypeId,
      status: { in: ['pending', 'confirmed'] },
      startTime: { lt: new Date(dayEndISO) },
      endTime: { gt: new Date(dayStartISO) },
    },
    select: { startTime: true, endTime: true },
  });

  const allBusy = [
    ...busyTimes,
    ...existingBookings.map((b) => ({
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
    })),
  ];

  // Subtract busy times (including buffer) from candidates
  const bufferBeforeMs = eventType.bufferBefore * 60 * 1000;
  const bufferAfterMs = eventType.bufferAfter * 60 * 1000;

  return filtered.filter((slot) => {
    const slotStart = new Date(slot.startTime).getTime() - bufferBeforeMs;
    const slotEnd = new Date(slot.endTime).getTime() + bufferAfterMs;

    return !allBusy.some((busy) => {
      const busyStart = new Date(busy.start).getTime();
      const busyEnd = new Date(busy.end).getTime();
      // Overlap check using half-open intervals [start, end)
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}

/**
 * Given a YYYY-MM-DD string, return the next day as YYYY-MM-DD.
 */
function nextDateStr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const next = new Date(year, month - 1, day + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

/**
 * Determine which host-timezone calendar days are covered by a UTC window.
 * Returns an array of YYYY-MM-DD strings in the host timezone.
 */
function getHostDaysCoveredByBookerDay(
  windowStartUTC: Date,
  windowEndUTC: Date,
  hostTimezone: string
): string[] {
  const days: string[] = [];
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: hostTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Check each hour of the window to find all host days covered
  let current = windowStartUTC.getTime();
  const end = windowEndUTC.getTime();
  while (current < end) {
    const dateStr = formatter.format(new Date(current));
    if (!days.includes(dateStr)) {
      days.push(dateStr);
    }
    current += 3600_000; // advance 1 hour
  }
  // Also check the end boundary minus 1ms
  const endDateStr = formatter.format(new Date(end - 1));
  if (!days.includes(endDateStr)) {
    days.push(endDateStr);
  }

  return days;
}

function getDayOfWeekInTimezone(dateStr: string, timezone: string): number {
  const date = new Date(`${dateStr}T12:00:00`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const dayName = formatter.format(date);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[dayName] ?? 0;
}

function generateCandidateSlots(
  date: string,
  daySlots: TimeSlot[],
  durationMinutes: number,
  timezone: string
): AvailableSlot[] {
  const candidates: AvailableSlot[] = [];
  const durationMs = durationMinutes * 60 * 1000;

  for (const slot of daySlots) {
    // Create times in the event type's timezone
    const windowStart = parseTimeInTimezone(date, slot.start, timezone);
    const windowEnd = parseTimeInTimezone(date, slot.end, timezone);

    let current = windowStart.getTime();
    while (current + durationMs <= windowEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current + durationMs);
      candidates.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
      });
      // Advance by duration (slots are back-to-back, no gaps)
      current += durationMs;
    }
  }

  return candidates;
}

/**
 * Convert a local date+time in a given timezone to a UTC Date.
 *
 * Uses a two-pass approach to handle DST transitions correctly:
 * 1. Guess the UTC offset by checking what local time the "naive UTC" instant
 *    maps to in the target timezone.
 * 2. Verify the offset at the resulting instant (it may differ by ±1h near
 *    a DST boundary) and correct if needed.
 */
function parseTimeInTimezone(
  date: string,
  time: string,
  timezone: string
): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  // Express the desired local time as a UTC millisecond value (naive)
  const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Pass 1: derive offset at the naive instant
  const offset1 = getTimezoneOffsetMs(targetLocalMs, timezone);
  const utcGuess = targetLocalMs - offset1;

  // Pass 2: verify offset at the resolved instant (handles DST edge cases)
  const offset2 = getTimezoneOffsetMs(utcGuess, timezone);
  if (offset2 !== offset1) {
    return new Date(targetLocalMs - offset2);
  }

  return new Date(utcGuess);
}

/**
 * Return the UTC offset (in ms) for `timezone` at the given UTC instant.
 * offset = localTime - utcTime  (positive east of Greenwich).
 */
function getTimezoneOffsetMs(utcMs: number, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(utcMs));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  let localHour = get('hour');
  if (localHour === 24) localHour = 0; // midnight edge case in some locales

  const localAsUtcMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    localHour,
    get('minute'),
    get('second')
  );

  return localAsUtcMs - utcMs;
}

interface BusyTime {
  start: string;
  end: string;
}

async function fetchBusyTimes(
  checkCalendars: Array<{
    calendar: {
      id: string;
      googleCalendarId: string;
      googleAccountId: string;
      googleAccount: { id: string; status: string };
    };
  }>,
  timeMin: string,
  timeMax: string,
  eventTimezone: string
): Promise<BusyTime[]> {
  const busyTimes: BusyTime[] = [];

  // Group calendars by account to reuse access tokens
  const byAccount = new Map<
    string,
    Array<{ calendarId: string; googleCalendarId: string }>
  >();
  for (const link of checkCalendars) {
    if (link.calendar.googleAccount.status !== 'active') continue;
    const accountId = link.calendar.googleAccountId;
    const accountCalendars = byAccount.get(accountId) || [];
    accountCalendars.push({
      calendarId: link.calendar.id,
      googleCalendarId: link.calendar.googleCalendarId,
    });
    byAccount.set(accountId, accountCalendars);
  }

  for (const [accountId, calendars] of byAccount) {
    try {
      const accessToken = await getValidAccessToken(accountId);
      for (const cal of calendars) {
        try {
          const { events } = await listAllEvents(
            accessToken,
            cal.googleCalendarId,
            { timeMin, timeMax }
          );
          for (const event of events) {
            if (event.status === 'cancelled') continue;

            let start: string;
            let end: string;

            if (event.start.dateTime && event.end.dateTime) {
              // Timed event — already has timezone offset
              start = event.start.dateTime;
              end = event.end.dateTime;
            } else if (event.start.date && event.end.date) {
              // All-day event — Google uses floating dates (YYYY-MM-DD).
              // Convert to midnight in the calendar's timezone, not UTC,
              // so the busy window aligns with the correct local day.
              const calTz = event.start.timeZone || eventTimezone;
              start = parseTimeInTimezone(event.start.date, '00:00', calTz).toISOString();
              end = parseTimeInTimezone(event.end.date, '00:00', calTz).toISOString();
            } else {
              continue;
            }

            busyTimes.push({ start, end });
          }
        } catch {
          // Skip individual calendar errors — availability is best-effort
        }
      }
    } catch {
      // Skip account-level errors (revoked, etc.)
    }
  }

  return busyTimes;
}
