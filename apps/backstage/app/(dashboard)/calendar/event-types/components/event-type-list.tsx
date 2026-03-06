'use client';

import { useState } from 'react';
import { CalendarDays, Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { EventTypeFormDialog } from './event-type-form-dialog';

interface EventType {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  color: string | null;
  isActive: boolean;
  bufferBefore: number;
  bufferAfter: number;
  minNotice: number;
  maxFutureDays: number;
  availability: Record<string, Array<{ start: string; end: string }>>;
  timezone: string;
  targetCalendarId: string | null;
  checkCalendarIds: string[];
  bookingCount: number;
}

interface CalendarOption {
  id: string;
  summary: string;
  accountEmail: string;
  accessRole: string;
}

export function EventTypeList({
  eventTypes: initial,
  calendars,
}: {
  eventTypes: EventType[];
  calendars: CalendarOption[];
}) {
  const [eventTypes, setEventTypes] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event type?')) return;
    try {
      const res = await fetch(`/api/calendar/event-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEventTypes(eventTypes.filter((et) => et.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/calendar/event-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        setEventTypes(eventTypes.map((et) => (et.id === id ? { ...et, isActive } : et)));
      }
    } catch {
      // ignore
    }
  };

  const handleSaved = async () => {
    setShowForm(false);
    setEditing(null);
    // Refresh
    try {
      const res = await fetch('/api/calendar/event-types');
      if (res.ok) {
        const data = await res.json();
        setEventTypes(
          data.map((et: any) => ({
            ...et,
            targetCalendarId: et.targetCalendar?.id || null,
            checkCalendarIds: et.checkCalendars?.map((c: any) => c.calendar?.id || c.calendarId) || [],
            bookingCount: et._count?.bookings || 0,
          }))
        );
      }
    } catch {
      window.location.reload();
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin.replace(':3001', ':3000')}/schedule/${slug}`);
  };

  return (
    <div>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Event Type
        </button>
      </div>

      {eventTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No event types yet. Create one to enable public scheduling.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((et) => (
            <div
              key={et.id}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              {et.color && (
                <div
                  className="h-10 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: et.color }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{et.title}</h3>
                  {!et.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{et.durationMinutes} min</span>
                  <span>/schedule/{et.slug}</span>
                  <span>{et.bookingCount} bookings</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyLink(et.slug)}
                  className="rounded-md p-1.5 hover:bg-muted"
                  title="Copy link"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
                <a
                  href={`/schedule/${et.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 hover:bg-muted"
                  title="Preview"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(et);
                    setShowForm(true);
                  }}
                  className="rounded-md p-1.5 hover:bg-muted"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(et.id, !et.isActive)}
                  className={`rounded-md px-2 py-1 text-xs ${
                    et.isActive
                      ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  {et.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(et.id)}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EventTypeFormDialog
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          eventType={editing}
          calendars={calendars}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
