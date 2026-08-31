import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const eventType = await database.eventType.findUnique({
    where: { id },
    include: {
      checkCalendars: {
        include: { calendar: { select: { id: true, summary: true } } },
      },
      targetCalendar: { select: { id: true, summary: true } },
    },
  });

  if (!eventType) {
    return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
  }

  return NextResponse.json(eventType);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  // Handle check calendar updates separately
  if (body.checkCalendarIds) {
    await database.eventTypeCheckCalendar.deleteMany({
      where: { eventTypeId: id },
    });
    if (body.checkCalendarIds.length > 0) {
      await database.eventTypeCheckCalendar.createMany({
        data: body.checkCalendarIds.map((calendarId: string) => ({
          eventTypeId: id,
          calendarId,
        })),
      });
    }
  }

  const { checkCalendarIds, ...updateData } = body;
  const eventType = await database.eventType.update({
    where: { id },
    data: {
      ...(updateData.slug !== undefined && { slug: updateData.slug }),
      ...(updateData.title !== undefined && { title: updateData.title }),
      ...(updateData.description !== undefined && { description: updateData.description }),
      ...(updateData.durationMinutes !== undefined && { durationMinutes: updateData.durationMinutes }),
      ...(updateData.color !== undefined && { color: updateData.color }),
      ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
      ...(updateData.bufferBefore !== undefined && { bufferBefore: updateData.bufferBefore }),
      ...(updateData.bufferAfter !== undefined && { bufferAfter: updateData.bufferAfter }),
      ...(updateData.minNotice !== undefined && { minNotice: updateData.minNotice }),
      ...(updateData.maxFutureDays !== undefined && { maxFutureDays: updateData.maxFutureDays }),
      ...(updateData.availability !== undefined && { availability: updateData.availability }),
      ...(updateData.timezone !== undefined && { timezone: updateData.timezone }),
      ...(updateData.targetCalendarId !== undefined && { targetCalendarId: updateData.targetCalendarId }),
    },
  });

  return NextResponse.json(eventType);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  // Check for ANY bookings (including cancelled) — FK is ON DELETE RESTRICT
  const totalBookings = await database.booking.count({
    where: { eventTypeId: id },
  });

  if (totalBookings > 0) {
    // Deactivate instead of deleting to preserve booking FK integrity
    const eventType = await database.eventType.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({
      ...eventType,
      _deactivated: true,
      _reason: `Has ${totalBookings} booking(s). Deactivated instead of deleted.`,
    });
  }

  await database.eventType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
