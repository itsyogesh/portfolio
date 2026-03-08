import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const eventType = await database.eventType.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      durationMinutes: true,
      color: true,
      timezone: true,
      minNotice: true,
      maxFutureDays: true,
    },
  });

  if (!eventType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(eventType);
}
