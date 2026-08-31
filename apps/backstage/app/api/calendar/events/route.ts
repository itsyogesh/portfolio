import { database } from '@packages/db';
import { getValidAccessToken, createEvent as googleCreateEvent } from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  // Use overlapping range filter: event overlaps [start, end) if event.start < end AND event.end > start
  const where: Record<string, unknown> = {};
  if (start && end) {
    where.startTime = { lt: new Date(end) };
    where.endTime = { gt: new Date(start) };
  } else if (start) {
    where.endTime = { gt: new Date(start) };
  } else if (end) {
    where.startTime = { lt: new Date(end) };
  }

  // Only show events from visible calendars
  const visibleCalendars = await database.googleCalendar.findMany({
    where: { isVisible: true },
    select: { id: true },
  });
  where.calendarId = { in: visibleCalendars.map((c) => c.id) };

  const events = await database.calendarEventCache.findMany({
    where,
    include: {
      calendar: { select: { summary: true, color: true, accessRole: true, googleAccountId: true } },
      googleAccount: { select: { googleEmail: true, color: true, displayName: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { summary, description, location, startTime, endTime, isAllDay, calendarId } = body;

    // Look up calendar to get Google IDs
    const calendar = await database.googleCalendar.findUniqueOrThrow({
      where: { id: calendarId },
    });

    // Check write access
    if (!['writer', 'owner'].includes(calendar.accessRole)) {
      return NextResponse.json(
        { error: 'Calendar is read-only' },
        { status: 403 }
      );
    }

    const accessToken = await getValidAccessToken(calendar.googleAccountId);

    // Google all-day events use exclusive end date (June 15 → end = "2025-06-16")
    const allDayEndDate = (() => {
      if (!isAllDay) return '';
      const d = new Date(endTime.split('T')[0]);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })();

    const eventData = isAllDay
      ? {
          summary,
          description,
          location,
          start: { date: startTime.split('T')[0] },
          end: { date: allDayEndDate },
        }
      : {
          summary,
          description,
          location,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
        };

    const googleEvent = await googleCreateEvent(
      accessToken,
      calendar.googleCalendarId,
      eventData
    );

    // Cache the created event
    const cached = await database.calendarEventCache.create({
      data: {
        googleEventId: googleEvent.id,
        summary: googleEvent.summary || null,
        description: googleEvent.description || null,
        location: googleEvent.location || null,
        startTime: new Date(
          googleEvent.start.dateTime || `${googleEvent.start.date}T00:00:00Z`
        ),
        endTime: new Date(
          googleEvent.end.dateTime || `${googleEvent.end.date}T00:00:00Z`
        ),
        isAllDay: !!googleEvent.start.date,
        status: googleEvent.status || 'confirmed',
        htmlLink: googleEvent.htmlLink || null,
        calendarId: calendar.id,
        googleAccountId: calendar.googleAccountId,
      },
    });

    return NextResponse.json(cached, { status: 201 });
  } catch (err) {
    console.error('Create event error:', err);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
