import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventTypes = await database.eventType.findMany({
    include: {
      checkCalendars: {
        include: { calendar: { select: { id: true, summary: true } } },
      },
      targetCalendar: { select: { id: true, summary: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(eventTypes);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const eventType = await database.eventType.create({
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description || null,
        durationMinutes: body.durationMinutes,
        color: body.color || null,
        isActive: body.isActive ?? true,
        bufferBefore: body.bufferBefore ?? 0,
        bufferAfter: body.bufferAfter ?? 0,
        minNotice: body.minNotice ?? 60,
        maxFutureDays: body.maxFutureDays ?? 60,
        availability: body.availability,
        timezone: body.timezone || 'Asia/Kolkata',
        targetCalendarId: body.targetCalendarId || null,
        ...(body.checkCalendarIds?.length && {
          checkCalendars: {
            create: body.checkCalendarIds.map((calendarId: string) => ({
              calendarId,
            })),
          },
        }),
      },
    });

    return NextResponse.json(eventType, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 400 }
    );
  }
}
