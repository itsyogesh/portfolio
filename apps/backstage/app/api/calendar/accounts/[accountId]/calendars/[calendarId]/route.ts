import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../_lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; calendarId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountId, calendarId } = await params;
  const body = await request.json();

  // Verify the calendar belongs to this account before updating
  const existing = await database.googleCalendar.findFirst({
    where: { id: calendarId, googleAccountId: accountId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Calendar not found for this account' },
      { status: 404 }
    );
  }

  const calendar = await database.googleCalendar.update({
    where: { id: calendarId },
    data: {
      ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
      ...(body.color !== undefined && { color: body.color }),
    },
  });

  return NextResponse.json(calendar);
}
