import { database } from '@packages/db';
import { listAllEvents } from './google-api';
import { getValidAccessToken } from './token-manager';
import type { AvailabilitySchedule, AvailableSlot, TimeSlot } from './types';

/**
 * Get available booking slots for an event type on a given date.
 */
export async function getAvailableSlots(
  eventTypeId: string,
  date: string, // YYYY-MM-DD
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

  // Parse the requested date in the event type's timezone
  const dayStart = new Date(`${date}T00:00:00`);
  const dayOfWeek = getDayOfWeekInTimezone(date, tz);

  const daySlots = availability[dayOfWeek];
  if (!daySlots || daySlots.length === 0) return [];

  // Generate candidate time slots
  const candidates = generateCandidateSlots(
    date,
    daySlots,
    eventType.durationMinutes,
    tz
  );

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

  // Fetch busy times — compute day boundaries in the event type's timezone
  // Use next-day midnight instead of +24h to handle DST transitions (23h/25h days)
  const dayStartUTC = parseTimeInTimezone(date, '00:00', tz);
  const [year, month, day_] = date.split('-').map(Number);
  const nextDay = new Date(year, month - 1, day_ + 1);
  const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
  const dayEndUTC = parseTimeInTimezone(nextDayStr, '00:00', tz);
  const dayStartISO = dayStartUTC.toISOString();
  const dayEndISO = dayEndUTC.toISOString();

  const busyTimes = await fetchBusyTimes(
    eventType.checkCalendars,
    dayStartISO,
    dayEndISO
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
  timeMax: string
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
    if (!byAccount.has(accountId)) {
      byAccount.set(accountId, []);
    }
    byAccount.get(accountId)!.push({
      calendarId: link.calendar.id,
      googleCalendarId: link.calendar.googleCalendarId,
    });
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
            const start =
              event.start.dateTime || `${event.start.date}T00:00:00Z`;
            const end = event.end.dateTime || `${event.end.date}T00:00:00Z`;
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
