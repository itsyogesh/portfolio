'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Ban, Calendar, Mail, User } from 'lucide-react';

interface Booking {
  id: string;
  bookerName: string;
  bookerEmail: string;
  bookerTimezone: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  eventType: {
    title: string;
    slug: string;
    durationMinutes: number;
    color: string | null;
  };
}

export function BookingList({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    const reason = prompt('Cancellation reason (optional):');
    if (reason === null) return; // User clicked cancel on prompt

    setCancelling(id);
    try {
      const res = await fetch(`/api/calendar/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelReason: reason || undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(
          bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString(),
                  cancelReason: reason || null,
                }
              : b
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setCancelling(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className={`rounded-lg border border-border p-4 ${
            booking.status === 'cancelled' ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: booking.eventType.color || '#4285f4' }}
                />
                <span className="text-sm font-medium">{booking.eventType.title}</span>
                {statusBadge(booking.status)}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {booking.bookerName}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {booking.bookerEmail}
                </span>
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                {format(parseISO(booking.startTime), 'EEE, MMM d, yyyy')} at{' '}
                {format(parseISO(booking.startTime), 'h:mm a')} –{' '}
                {format(parseISO(booking.endTime), 'h:mm a')}
                <span className="ml-2">({booking.bookerTimezone})</span>
              </div>

              {booking.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {booking.notes}
                </p>
              )}

              {booking.cancelReason && (
                <p className="text-xs text-red-500 mt-1">
                  Cancelled: {booking.cancelReason}
                </p>
              )}
            </div>

            {booking.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => handleCancel(booking.id)}
                disabled={cancelling === booking.id}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" />
                {cancelling === booking.id ? '...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
