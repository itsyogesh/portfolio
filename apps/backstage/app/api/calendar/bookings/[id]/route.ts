import { database } from '@packages/db';
import {
  getValidAccessToken,
  deleteEvent as googleDeleteEvent,
} from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const booking = await database.booking.findUnique({
    where: { id },
    include: { eventType: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  if (body.status === 'cancelled') {
    const booking = await database.booking.findUniqueOrThrow({
      where: { id },
      include: { eventType: { include: { targetCalendar: true } } },
    });

    // Delete from Google Calendar if exists
    if (booking.googleEventId && booking.eventType.targetCalendar) {
      try {
        const accessToken = await getValidAccessToken(
          booking.eventType.targetCalendar.googleAccountId
        );
        await googleDeleteEvent(
          accessToken,
          booking.eventType.targetCalendar.googleCalendarId,
          booking.googleEventId
        );
      } catch {
        // Best-effort — event may already be deleted
      }
    }

    const updated = await database.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: body.cancelReason || null,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
}
