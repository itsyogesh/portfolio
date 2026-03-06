import { database } from '@packages/db';
import { getAvailableSlots } from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // YYYY-MM-DD
  const timezone = searchParams.get('timezone') || 'UTC';

  if (!date) {
    return NextResponse.json({ error: 'date parameter required' }, { status: 400 });
  }

  const eventType = await database.eventType.findUnique({
    where: { slug, isActive: true },
  });

  if (!eventType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const slots = await getAvailableSlots(eventType.id, date, timezone);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('Slots error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
