import {
  createEvent as googleCreateEvent,
  getAvailableSlots,
  getValidAccessToken,
} from '@packages/calendar';
import { type Booking, database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_BOOKINGS_PER_EMAIL = 3;
const MAX_BOOKINGS_GLOBALLY = 20;

const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((timeZone) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format();
      return true;
    } catch {
      return false;
    }
  }, 'Invalid timezone');

const bookingSchema = z.object({
  bookerName: z.string().trim().min(1).max(100),
  bookerEmail: z.string().trim().email().max(254),
  bookerTimezone: timeZoneSchema,
  startTime: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional(),
  idempotencyKey: z.string().uuid(),
});

type PublicBooking = Pick<
  Booking,
  'id' | 'status' | 'startTime' | 'endTime'
>;

function publicBooking(booking: PublicBooking) {
  return {
    id: booking.id,
    status: booking.status,
    startTime: booking.startTime,
    endTime: booking.endTime,
  };
}

function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many booking requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': '600' } }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid booking details' },
      { status: 400 }
    );
  }

  const { slug } = await params;
  const {
    bookerName,
    bookerEmail: rawBookerEmail,
    bookerTimezone,
    startTime,
    notes,
    idempotencyKey,
  } = parsed.data;
  const bookerEmail = rawBookerEmail.toLowerCase();

  try {
    const eventType = await database.eventType.findUnique({
      where: { slug, isActive: true },
      include: { targetCalendar: true },
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    const existing = await database.booking.findUnique({
      where: { idempotencyKey },
      select: {
        id: true,
        eventTypeId: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });
    if (existing) {
      if (existing.eventTypeId !== eventType.id) {
        return NextResponse.json(
          { error: 'Idempotency key is already in use' },
          { status: 409 }
        );
      }
      if (existing.status === 'confirmed' || existing.status === 'pending') {
        return NextResponse.json(publicBooking(existing));
      }
      return NextResponse.json(
        { error: 'Previous booking was cancelled. Please try again.' },
        { status: 409 }
      );
    }

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const [emailBookingCount, globalBookingCount] = await Promise.all([
      database.booking.count({
        where: { bookerEmail, createdAt: { gte: windowStart } },
      }),
      database.booking.count({ where: { createdAt: { gte: windowStart } } }),
    ]);
    if (
      emailBookingCount >= MAX_BOOKINGS_PER_EMAIL ||
      globalBookingCount >= MAX_BOOKINGS_GLOBALLY
    ) {
      return rateLimitResponse();
    }

    const start = new Date(startTime);
    const end = new Date(
      start.getTime() + eventType.durationMinutes * 60 * 1000
    );

    // Availability expects the day selected in the booker's timezone.
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: bookerTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(start);
    const available = await getAvailableSlots(
      eventType.id,
      dateStr,
      bookerTimezone
    );
    const slotAvailable = available.some(
      (slot) => new Date(slot.startTime).getTime() === start.getTime()
    );

    if (!slotAvailable) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    let reservation: Booking;
    try {
      reservation = await database.booking.create({
        data: {
          idempotencyKey,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (
        message.includes('no_overlapping_bookings') ||
        message.includes('exclusion') ||
        message.includes('idempotencyKey')
      ) {
        return NextResponse.json(
          { error: 'This time slot has just been booked. Please choose another.' },
          { status: 409 }
        );
      }
      throw error;
    }

    let confirmedBooking: Booking;
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
          },
          'all'
        );

        confirmedBooking = await database.booking.update({
          where: { id: reservation.id },
          data: { status: 'confirmed', googleEventId: googleEvent.id },
        });
      } catch (error) {
        console.error('Google Calendar creation failed:', error);
        await database.booking.update({
          where: { id: reservation.id },
          data: {
            status: 'cancelled',
            cancelReason: 'Google Calendar creation failed',
          },
        });
        return NextResponse.json(
          { error: 'Failed to create calendar event. Please try again.' },
          { status: 502 }
        );
      }
    } else {
      confirmedBooking = await database.booking.update({
        where: { id: reservation.id },
        data: { status: 'confirmed' },
      });
    }

    return NextResponse.json(publicBooking(confirmedBooking), { status: 201 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Unable to complete the booking' },
      { status: 500 }
    );
  }
}
