import { requireAdminPage } from '../../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { CalendarView } from './components/calendar-view';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'Manage your calendars and events',
};

export default async function CalendarPage() {
  await requireAdminPage();

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 4, 0);

  const [accounts, events] = await Promise.all([
    database.googleAccount.findMany({
      include: {
        calendars: { orderBy: { summary: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    database.calendarEventCache.findMany({
      where: {
        startTime: { gte: threeMonthsAgo },
        endTime: { lte: threeMonthsAhead },
        calendar: { isVisible: true },
      },
      include: {
        calendar: {
          select: {
            summary: true,
            color: true,
            accessRole: true,
            googleAccountId: true,
          },
        },
        googleAccount: {
          select: { googleEmail: true, color: true, displayName: true },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
  ]);

  const serializedEvents = events.map((e) => ({
    id: e.id,
    googleEventId: e.googleEventId,
    summary: e.summary,
    description: e.description,
    location: e.location,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    isAllDay: e.isAllDay,
    status: e.status,
    htmlLink: e.htmlLink,
    calendarId: e.calendarId,
    googleAccountId: e.googleAccountId,
    calendar: e.calendar,
    googleAccount: e.googleAccount,
  }));

  const serializedAccounts = accounts.map((a) => ({
    id: a.id,
    googleEmail: a.googleEmail,
    displayName: a.displayName,
    status: a.status,
    color: a.color,
    calendars: a.calendars.map((c) => ({
      id: c.id,
      googleCalendarId: c.googleCalendarId,
      summary: c.summary,
      color: c.color,
      isVisible: c.isVisible,
      isPrimary: c.isPrimary,
      accessRole: c.accessRole,
    })),
  }));

  return <CalendarView events={serializedEvents} accounts={serializedAccounts} />;
}
