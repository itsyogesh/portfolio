import { database } from '@packages/db';
import {
  getValidAccessToken,
  getEvent,
  updateEvent as googleUpdateEvent,
  deleteEvent as googleDeleteEvent,
} from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { eventId } = await params;
  const event = await database.calendarEventCache.findUnique({
    where: { id: eventId },
    include: {
      calendar: { select: { summary: true, color: true, accessRole: true } },
      googleAccount: { select: { googleEmail: true, color: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { eventId } = await params;
  const body = await request.json();

  const cached = await database.calendarEventCache.findUniqueOrThrow({
    where: { id: eventId },
    include: { calendar: true },
  });

  if (!['writer', 'owner'].includes(cached.calendar.accessRole)) {
    return NextResponse.json(
      { error: 'Calendar is read-only' },
      { status: 403 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(cached.googleAccountId);

    const updateData: Record<string, unknown> = {};
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.startTime !== undefined) {
      updateData.start = body.isAllDay
        ? { date: body.startTime.split('T')[0] }
        : { dateTime: body.startTime };
    }
    if (body.endTime !== undefined) {
      if (body.isAllDay) {
        // Google all-day events use exclusive end date (+1 day)
        const d = new Date(body.endTime.split('T')[0]);
        d.setDate(d.getDate() + 1);
        updateData.end = { date: d.toISOString().split('T')[0] };
      } else {
        updateData.end = { dateTime: body.endTime };
      }
    }

    const updated = await googleUpdateEvent(
      accessToken,
      cached.calendar.googleCalendarId,
      cached.googleEventId,
      updateData as Parameters<typeof googleUpdateEvent>[3]
    );

    // Update cache
    const updatedCache = await database.calendarEventCache.update({
      where: { id: eventId },
      data: {
        summary: updated.summary || null,
        description: updated.description || null,
        location: updated.location || null,
        startTime: new Date(
          updated.start.dateTime || `${updated.start.date}T00:00:00Z`
        ),
        endTime: new Date(
          updated.end.dateTime || `${updated.end.date}T00:00:00Z`
        ),
        isAllDay: !!updated.start.date,
        syncedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCache);
  } catch (err) {
    console.error('Update event error:', err);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { eventId } = await params;

  const cached = await database.calendarEventCache.findUniqueOrThrow({
    where: { id: eventId },
    include: { calendar: true },
  });

  if (!['writer', 'owner'].includes(cached.calendar.accessRole)) {
    return NextResponse.json(
      { error: 'Calendar is read-only' },
      { status: 403 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(cached.googleAccountId);
    await googleDeleteEvent(
      accessToken,
      cached.calendar.googleCalendarId,
      cached.googleEventId
    );

    await database.calendarEventCache.delete({ where: { id: eventId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete event error:', err);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
