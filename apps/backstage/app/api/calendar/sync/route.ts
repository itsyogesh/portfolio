import { database } from '@packages/db';
import {
  getValidAccessToken,
  listAllEvents,
  SyncTokenExpiredError,
} from '@packages/calendar';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const calendars = await database.googleCalendar.findMany({
    where: { isVisible: true },
    include: { googleAccount: { select: { id: true, status: true } } },
  });

  const results: Array<{ calendarId: string; synced: number; errors?: string }> = [];

  for (const cal of calendars) {
    if (cal.googleAccount.status !== 'active') continue;

    try {
      const accessToken = await getValidAccessToken(cal.googleAccountId);

      let events;
      let nextSyncToken: string | undefined;

      try {
        const result = await listAllEvents(accessToken, cal.googleCalendarId, {
          syncToken: cal.syncToken || undefined,
        });
        events = result.events;
        nextSyncToken = result.nextSyncToken;
      } catch (err) {
        if (err instanceof SyncTokenExpiredError) {
          // 410 GONE — clear cache and full re-sync
          await database.calendarEventCache.deleteMany({
            where: { calendarId: cal.id },
          });
          const now = new Date();
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

          const result = await listAllEvents(accessToken, cal.googleCalendarId, {
            timeMin: threeMonthsAgo.toISOString(),
            timeMax: threeMonthsAhead.toISOString(),
          });
          events = result.events;
          nextSyncToken = result.nextSyncToken;
        } else {
          throw err;
        }
      }

      // Upsert events in cache
      let synced = 0;
      for (const event of events) {
        if (event.status === 'cancelled') {
          // Remove cancelled events from cache
          await database.calendarEventCache.deleteMany({
            where: {
              calendarId: cal.id,
              googleEventId: event.id,
            },
          });
          continue;
        }

        const startTime = event.start.dateTime
          ? new Date(event.start.dateTime)
          : new Date(`${event.start.date}T00:00:00Z`);
        const endTime = event.end.dateTime
          ? new Date(event.end.dateTime)
          : new Date(`${event.end.date}T00:00:00Z`);

        await database.calendarEventCache.upsert({
          where: {
            calendarId_googleEventId: {
              calendarId: cal.id,
              googleEventId: event.id,
            },
          },
          update: {
            summary: event.summary || null,
            description: event.description || null,
            location: event.location || null,
            startTime,
            endTime,
            isAllDay: !!event.start.date,
            status: event.status || 'confirmed',
            htmlLink: event.htmlLink || null,
            syncedAt: new Date(),
          },
          create: {
            googleEventId: event.id,
            summary: event.summary || null,
            description: event.description || null,
            location: event.location || null,
            startTime,
            endTime,
            isAllDay: !!event.start.date,
            status: event.status || 'confirmed',
            htmlLink: event.htmlLink || null,
            calendarId: cal.id,
            googleAccountId: cal.googleAccountId,
          },
        });
        synced++;
      }

      // Update sync state
      await database.googleCalendar.update({
        where: { id: cal.id },
        data: {
          syncToken: nextSyncToken || cal.syncToken,
          lastSyncedAt: new Date(),
        },
      });

      results.push({ calendarId: cal.id, synced });
    } catch (err) {
      results.push({
        calendarId: cal.id,
        synced: 0,
        errors: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ results });
}
