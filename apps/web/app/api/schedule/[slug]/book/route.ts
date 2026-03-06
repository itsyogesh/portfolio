import { database } from '@packages/db';
import {
  getValidAccessToken,
  createEvent as googleCreateEvent,
  getAvailableSlots,
} from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const eventType = await database.eventType.findUnique({
    where: { slug, isActive: true },
    include: {
      targetCalendar: true,
      checkCalendars: { select: { calendarId: true } },
    },
  });

  if (!eventType) {
    return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
  }

  const body = await request.json();
  const { bookerName, bookerEmail, bookerTimezone, startTime, notes, idempotencyKey } = body;

  if (!bookerName || !bookerEmail || !bookerTimezone || !startTime) {
    return NextResponse.json(
      { error: 'Missing required fields: bookerName, bookerEmail, bookerTimezone, startTime' },
      { status: 400 }
    );
  }

  // Check idempotency — only return success for active bookings
  if (idempotencyKey) {
    const existing = await database.booking.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (existing.status === 'confirmed' || existing.status === 'pending') {
        return NextResponse.json(existing);
      }
      // Cancelled/failed booking for this key — let caller know to retry with a new key
      return NextResponse.json(
        { error: 'Previous booking for this request was cancelled. Please try again.' },
        { status: 409 }
      );
    }
  }

  // Calculate end time
  const start = new Date(startTime);
  const end = new Date(start.getTime() + eventType.durationMinutes * 60 * 1000);

  // Verify slot is still available — derive date in the event type's timezone, not UTC
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: eventType.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = dateFormatter.format(start); // YYYY-MM-DD
  const available = await getAvailableSlots(eventType.id, dateStr, bookerTimezone);
  const slotAvailable = available.some(
    (slot) => new Date(slot.startTime).getTime() === start.getTime()
  );

  if (!slotAvailable) {
    return NextResponse.json(
      { error: 'This time slot is no longer available' },
      { status: 409 }
    );
  }

  // Phase A: Reserve slot
  let booking;
  try {
    booking = await database.booking.create({
      data: {
        idempotencyKey: idempotencyKey || null,
        eventTypeId: eventType.id,
        targetCalendarId: eventType.targetCalendarId,
        bookerName,
        bookerEmail,
        bookerTimezone,
        startTime: start,
        endTime: end,
        status: 'pending',
        notes: notes || null,
      },
    });
  } catch (err: unknown) {
    // Check for exclusion constraint violation
    const message = err instanceof Error ? err.message : '';
    if (message.includes('no_overlapping_bookings') || message.includes('exclusion')) {
      return NextResponse.json(
        { error: 'This time slot has just been booked. Please choose another.' },
        { status: 409 }
      );
    }
    throw err;
  }

  // Phase B: Confirm with Google Calendar
  if (eventType.targetCalendar) {
    try {
      const accessToken = await getValidAccessToken(
        eventType.targetCalendar.googleAccountId
      );

      const googleEvent = await googleCreateEvent(
        accessToken,
        eventType.targetCalendar.googleCalendarId,
        {
          summary: `${eventType.title} with ${bookerName}`,
          description: [
            `Booked by: ${bookerName} (${bookerEmail})`,
            `Timezone: ${bookerTimezone}`,
            notes ? `Notes: ${notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: [{ email: bookerEmail }],
        }
      );

      // Confirm booking
      booking = await database.booking.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          googleEventId: googleEvent.id,
        },
      });
    } catch (err) {
      console.error('Google Calendar creation failed:', err);
      // Compensation: cancel the pending booking
      booking = await database.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled', cancelReason: 'Google Calendar creation failed' },
      });
      return NextResponse.json(
        { error: 'Failed to create calendar event. Please try again.' },
        { status: 500 }
      );
    }
  } else {
    // No target calendar — just confirm directly
    booking = await database.booking.update({
      where: { id: booking.id },
      data: { status: 'confirmed' },
    });
  }

  return NextResponse.json(booking, { status: 201 });
}
