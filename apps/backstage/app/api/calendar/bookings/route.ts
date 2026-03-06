import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const eventTypeId = searchParams.get('eventTypeId');
  const status = searchParams.get('status');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const where: Record<string, unknown> = {};
  if (eventTypeId) where.eventTypeId = eventTypeId;
  if (status) where.status = status;
  if (start) where.startTime = { gte: new Date(start) };
  if (end) where.endTime = { ...(where.endTime as object || {}), lte: new Date(end) };

  const bookings = await database.booking.findMany({
    where,
    include: {
      eventType: { select: { title: true, slug: true, durationMinutes: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return NextResponse.json(bookings);
}
