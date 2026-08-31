import { requireAdminPage } from '../../../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { EventTypeList } from './components/event-type-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Event Types',
  description: 'Manage scheduling event types',
};

export default async function EventTypesPage() {
  await requireAdminPage();

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

  const calendars = await database.googleCalendar.findMany({
    include: {
      googleAccount: { select: { googleEmail: true } },
    },
    orderBy: { summary: 'asc' },
  });

  const serialized = eventTypes.map((et) => ({
    id: et.id,
    slug: et.slug,
    title: et.title,
    description: et.description,
    durationMinutes: et.durationMinutes,
    color: et.color,
    isActive: et.isActive,
    bufferBefore: et.bufferBefore,
    bufferAfter: et.bufferAfter,
    minNotice: et.minNotice,
    maxFutureDays: et.maxFutureDays,
    availability: et.availability as Record<string, Array<{ start: string; end: string }>>,
    timezone: et.timezone,
    targetCalendarId: et.targetCalendar?.id || null,
    checkCalendarIds: et.checkCalendars.map((c) => c.calendar.id),
    bookingCount: et._count.bookings,
  }));

  const calendarOptions = calendars.map((c) => ({
    id: c.id,
    summary: c.summary,
    accountEmail: c.googleAccount.googleEmail,
    accessRole: c.accessRole,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Event Types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your public scheduling links.
          </p>
        </div>
      </div>

      <EventTypeList eventTypes={serialized} calendars={calendarOptions} />
    </div>
  );
}
