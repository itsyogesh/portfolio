'use client';

import { useState, useEffect } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

interface EventType {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  color: string | null;
  timezone: string;
  minNotice: number;
  maxFutureDays: number;
}

interface Slot {
  startTime: string;
  endTime: string;
}

export function BookingClient({ eventType }: { eventType: EventType }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<'date' | 'form'>('date');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = startOfDay(new Date());
  const maxDate = addDays(today, eventType.maxFutureDays);

  // Generate calendar dates (current month + next month)
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(
          `/api/schedule/${eventType.slug}/slots?date=${dateStr}&timezone=${encodeURIComponent(timezone)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        }
      } catch {
        setError('Failed to load available times');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, eventType.slug, timezone]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await fetch(`/api/schedule/${eventType.slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookerName: formData.get('name'),
          bookerEmail: formData.get('email'),
          bookerTimezone: timezone,
          startTime: selectedSlot.startTime,
          notes: formData.get('notes') || undefined,
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Booking failed');
        return;
      }

      // Redirect to confirmation
      window.location.href = `/schedule/${eventType.slug}/confirmed?time=${encodeURIComponent(selectedSlot.startTime)}&name=${encodeURIComponent(formData.get('name') as string)}`;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate days for the calendar grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Pad start
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const days = getDaysInMonth(viewMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (step === 'form' && selectedSlot) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setStep('date')}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          &larr; Back
        </button>

        <div className="mb-8">
          <h1 className="font-display text-2xl tracking-tight">
            {eventType.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {eventType.durationMinutes} min &middot;{' '}
            {format(new Date(selectedSlot.startTime), 'EEEE, MMMM d, yyyy')} at{' '}
            {format(new Date(selectedSlot.startTime), 'h:mm a')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name *
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Anything you'd like to discuss?"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>

          <p className="text-xs text-muted-foreground">
            Timezone: {timezone}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl tracking-tight">
          {eventType.title}
        </h1>
        {eventType.description && (
          <p className="text-muted-foreground mt-1">{eventType.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {eventType.durationMinutes} minutes
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">
              {format(viewMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1)
                  )
                }
                className="rounded-md border border-border p-1.5 hover:bg-muted"
              >
                &lsaquo;
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1)
                  )
                }
                className="rounded-md border border-border p-1.5 hover:bg-muted"
              >
                &rsaquo;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
            {days.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} />;
              }
              const isPast = isBefore(day, today);
              const isTooFar = day > maxDate;
              const isDisabled = isPast || isTooFar;
              const isSelected =
                selectedDate &&
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    rounded-md p-2 text-sm text-center transition-colors
                    ${isDisabled ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                    ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div>
          {!selectedDate && (
            <p className="text-sm text-muted-foreground">
              Select a date to see available times.
            </p>
          )}

          {selectedDate && loadingSlots && (
            <p className="text-sm text-muted-foreground">Loading times...</p>
          )}

          {selectedDate && !loadingSlots && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No available times on this date.
            </p>
          )}

          {selectedDate && !loadingSlots && slots.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3">
                {format(selectedDate, 'EEEE, MMMM d')}
              </p>
              {slots.map((slot) => {
                const isActive = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep('form');
                    }}
                    className={`
                      w-full rounded-md border px-4 py-2.5 text-sm text-left transition-colors
                      ${isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                    `}
                  >
                    {format(new Date(slot.startTime), 'h:mm a')}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
