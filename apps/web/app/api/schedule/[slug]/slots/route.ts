import { database } from '@packages/db';
import { getAvailableSlots } from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // YYYY-MM-DD
  const timezone = searchParams.get('timezone') || 'UTC';

  if (
    !date ||
    !dateSchema.safeParse(date).success ||
    timezone.length > 100 ||
    !isValidTimeZone(timezone)
  ) {
    return NextResponse.json(
      { error: 'A valid date and timezone are required' },
      { status: 400 }
    );
  }

  const eventType = await database.eventType.findUnique({
    where: { slug, isActive: true },
  });

  if (!eventType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const slots = await getAvailableSlots(eventType.id, date, timezone);
    return NextResponse.json(
      { slots },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    console.error('Slots error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
