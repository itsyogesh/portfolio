'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CalendarOption {
  id: string;
  summary: string;
  accountEmail: string;
  accessRole: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_AVAILABILITY: Record<string, Array<{ start: string; end: string }>> = {
  '1': [{ start: '09:00', end: '17:00' }],
  '2': [{ start: '09:00', end: '17:00' }],
  '3': [{ start: '09:00', end: '17:00' }],
  '4': [{ start: '09:00', end: '17:00' }],
  '5': [{ start: '09:00', end: '17:00' }],
};

export function EventTypeFormDialog({
  open,
  onClose,
  eventType,
  calendars,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  eventType: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    color: string | null;
    bufferBefore: number;
    bufferAfter: number;
    minNotice: number;
    maxFutureDays: number;
    availability: Record<string, Array<{ start: string; end: string }>>;
    timezone: string;
    targetCalendarId: string | null;
    checkCalendarIds: string[];
  } | null;
  calendars: CalendarOption[];
  onSaved: () => void;
}) {
  const isEditing = !!eventType;
  const [title, setTitle] = useState(eventType?.title || '');
  const [slug, setSlug] = useState(eventType?.slug || '');
  const [description, setDescription] = useState(eventType?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(eventType?.durationMinutes || 30);
  const [color, setColor] = useState(eventType?.color || '#4285f4');
  const [bufferBefore, setBufferBefore] = useState(eventType?.bufferBefore || 0);
  const [bufferAfter, setBufferAfter] = useState(eventType?.bufferAfter || 0);
  const [minNotice, setMinNotice] = useState(eventType?.minNotice || 60);
  const [maxFutureDays, setMaxFutureDays] = useState(eventType?.maxFutureDays || 60);
  const [timezone, setTimezone] = useState(eventType?.timezone || 'Asia/Kolkata');
  const [targetCalendarId, setTargetCalendarId] = useState(eventType?.targetCalendarId || '');
  const [checkCalendarIds, setCheckCalendarIds] = useState<string[]>(eventType?.checkCalendarIds || []);
  const [availability, setAvailability] = useState(eventType?.availability || DEFAULT_AVAILABILITY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const toggleDay = (dayIndex: number) => {
    const key = String(dayIndex);
    if (availability[key]) {
      const { [key]: _, ...rest } = availability;
      setAvailability(rest);
    } else {
      setAvailability({ ...availability, [key]: [{ start: '09:00', end: '17:00' }] });
    }
  };

  const updateDaySlot = (dayIndex: number, field: 'start' | 'end', value: string) => {
    const key = String(dayIndex);
    const slots = availability[key] || [{ start: '09:00', end: '17:00' }];
    setAvailability({
      ...availability,
      [key]: [{ ...slots[0], [field]: value }],
    });
  };

  const toggleCheckCalendar = (calId: string) => {
    setCheckCalendarIds(
      checkCalendarIds.includes(calId)
        ? checkCalendarIds.filter((id) => id !== calId)
        : [...checkCalendarIds, calId]
    );
  };

  const writableCalendars = calendars.filter((c) => ['writer', 'owner'].includes(c.accessRole));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        durationMinutes,
        color,
        bufferBefore,
        bufferAfter,
        minNotice,
        maxFutureDays,
        timezone,
        targetCalendarId: targetCalendarId || null,
        checkCalendarIds,
        availability,
      };

      const url = isEditing
        ? `/api/calendar/event-types/${eventType.id}`
        : '/api/calendar/event-types';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 overflow-y-auto">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background shadow-xl mb-16">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">{isEditing ? 'Edit Event Type' : 'New Event Type'}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="30 Min Meeting"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="30-min-meeting"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              placeholder="A quick chat about anything"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Duration (min)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={5}
                max={480}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Buffer before</label>
              <input
                type="number"
                value={bufferBefore}
                onChange={(e) => setBufferBefore(Number(e.target.value))}
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Buffer after</label>
              <input
                type="number"
                value={bufferAfter}
                onChange={(e) => setBufferAfter(Number(e.target.value))}
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Min notice (min)</label>
              <input
                type="number"
                value={minNotice}
                onChange={(e) => setMinNotice(Number(e.target.value))}
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max future days</label>
              <input
                type="number"
                value={maxFutureDays}
                onChange={(e) => setMaxFutureDays(Number(e.target.value))}
                min={1}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 rounded-md border border-border cursor-pointer"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Availability</label>
            <div className="space-y-2">
              {DAYS.map((day, i) => (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-24">
                    <input
                      type="checkbox"
                      checked={!!availability[String(i)]}
                      onChange={() => toggleDay(i)}
                      className="rounded border-border"
                    />
                    <span className="text-xs">{day.slice(0, 3)}</span>
                  </label>
                  {availability[String(i)] && (
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={availability[String(i)][0].start}
                        onChange={(e) => updateDaySlot(i, 'start', e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={availability[String(i)][0].end}
                        onChange={(e) => updateDaySlot(i, 'end', e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Target calendar */}
          {writableCalendars.length > 0 && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Create events on
              </label>
              <select
                value={targetCalendarId}
                onChange={(e) => setTargetCalendarId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">None</option>
                {writableCalendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} ({cal.accountEmail})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Check calendars */}
          {calendars.length > 0 && (
            <div>
              <label className="block text-xs text-muted-foreground mb-2">
                Check these for conflicts
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {calendars.map((cal) => (
                  <label key={cal.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checkCalendarIds.includes(cal.id)}
                      onChange={() => toggleCheckCalendar(cal.id)}
                      className="rounded border-border"
                    />
                    {cal.summary}
                    <span className="text-xs text-muted-foreground">({cal.accountEmail})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
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
