import { database } from '@packages/db';
import { getValidAccessToken, listCalendars } from '@packages/calendar';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../_lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountId } = await params;

  try {
    const accessToken = await getValidAccessToken(accountId);
    const googleCalendars = await listCalendars(accessToken);

    // Upsert calendars in DB
    const calendars = await Promise.all(
      googleCalendars.map((gc) =>
        database.googleCalendar.upsert({
          where: {
            googleAccountId_googleCalendarId: {
              googleAccountId: accountId,
              googleCalendarId: gc.id,
            },
          },
          update: {
            summary: gc.summary,
            color: gc.backgroundColor || null,
            isPrimary: gc.primary || false,
            accessRole: gc.accessRole,
          },
          create: {
            googleCalendarId: gc.id,
            summary: gc.summary,
            color: gc.backgroundColor || null,
            isPrimary: gc.primary || false,
            accessRole: gc.accessRole,
            googleAccountId: accountId,
          },
        })
      )
    );

    return NextResponse.json(calendars);
  } catch (err) {
    console.error('Calendar sync error:', err);
    return NextResponse.json(
      { error: 'Failed to sync calendars' },
      { status: 500 }
    );
  }
}
