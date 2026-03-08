'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import type { CalendarEventSerialized } from './calendar-view';

interface WritableCalendar {
  id: string;
  googleCalendarId: string;
  summary: string;
  color: string | null;
  isPrimary: boolean;
  accessRole: string;
  accountColor: string;
  accountEmail: string;
}

export function EventFormDialog({
  open,
  onClose,
  event,
  defaultDate,
  calendars,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  event: CalendarEventSerialized | null;
  defaultDate: Date | null;
  calendars: WritableCalendar[];
  onSaved: () => void;
}) {
  const isEditing = !!event;
  const defaultCalendar =
    calendars.find((c) => c.isPrimary) || calendars[0];

  const [summary, setSummary] = useState(event?.summary || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [startDate, setStartDate] = useState(
    event
      ? format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm")
      : defaultDate
        ? format(defaultDate, "yyyy-MM-dd'T'09:00")
        : format(new Date(), "yyyy-MM-dd'T'09:00")
  );
  const [endDate, setEndDate] = useState(
    event
      ? format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm")
      : defaultDate
        ? format(defaultDate, "yyyy-MM-dd'T'10:00")
        : format(new Date(), "yyyy-MM-dd'T'10:00")
  );
  const [calendarId, setCalendarId] = useState(
    event?.calendarId || defaultCalendar?.id || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body = {
        summary: summary.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
        isAllDay,
        calendarId,
      };

      const url = isEditing
        ? `/api/calendar/events/${event.id}`
        : '/api/calendar/events';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save event');
        return;
      }

      onSaved();
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">
            {isEditing ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded border-border"
              />
              All day
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="start"
                className="block text-xs text-muted-foreground mb-1"
              >
                Start
              </label>
              <input
                id="start"
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? startDate.split('T')[0] : startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="end"
                className="block text-xs text-muted-foreground mb-1"
              >
                End
              </label>
              <input
                id="end"
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? endDate.split('T')[0] : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-xs text-muted-foreground mb-1"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs text-muted-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          {!isEditing && calendars.length > 0 && (
            <div>
              <label
                htmlFor="calendar"
                className="block text-xs text-muted-foreground mb-1"
              >
                Calendar
              </label>
              <select
                id="calendar"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} ({cal.accountEmail})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
