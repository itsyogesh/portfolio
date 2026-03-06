import { requireAdminPage } from '../../../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { BookingList } from './components/booking-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bookings',
  description: 'Manage calendar bookings',
};

export default async function BookingsPage() {
  await requireAdminPage();

  const bookings = await database.booking.findMany({
    include: {
      eventType: { select: { title: true, slug: true, durationMinutes: true, color: true } },
    },
    orderBy: { startTime: 'desc' },
    take: 100,
  });

  const serialized = bookings.map((b) => ({
    id: b.id,
    bookerName: b.bookerName,
    bookerEmail: b.bookerEmail,
    bookerTimezone: b.bookerTimezone,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    notes: b.notes,
    cancelledAt: b.cancelledAt?.toISOString() || null,
    cancelReason: b.cancelReason,
    createdAt: b.createdAt.toISOString(),
    eventType: b.eventType,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </p>
      </div>

      <BookingList bookings={serialized} />
    </div>
  );
}
