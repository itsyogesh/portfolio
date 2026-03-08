'use client';

import {
  format,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  startOfDay,
} from 'date-fns';
import type { CalendarEventSerialized } from './calendar-view';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64; // slightly taller for day view

export function DayView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
}: {
  currentDate: Date;
  events: CalendarEventSerialized[];
  onEventClick: (event: CalendarEventSerialized, e: React.MouseEvent) => void;
  onDayClick: (date: Date) => void;
}) {
  const dayEvents = events.filter((e) => {
    if (e.isAllDay) return false;
    // Include events that overlap this day (handles overnight/multi-day timed events)
    const start = parseISO(e.startTime);
    const end = parseISO(e.endTime);
    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    return start < dayEnd && end > dayStart;
  });

  const allDayEvents = events.filter((e) => {
    if (!e.isAllDay) return false;
    // All-day events use exclusive end date — half-open [start, end)
    const start = parseISO(e.startTime);
    const end = parseISO(e.endTime);
    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    return start < dayEnd && end > dayStart;
  });

  const getEventPosition = (event: CalendarEventSerialized) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    // Clamp to current day boundaries for overnight events
    const clampedStart = start < dayStart ? dayStart : start;
    const clampedEnd = end > dayEnd ? dayEnd : end;
    const topMinutes = differenceInMinutes(clampedStart, dayStart);
    const durationMinutes = differenceInMinutes(clampedEnd, clampedStart);
    return {
      top: (topMinutes / 60) * HOUR_HEIGHT,
      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24),
    };
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Day header */}
      <div className="border-b border-border px-4 py-3 bg-muted/30">
        <div className="text-xs text-muted-foreground">
          {format(currentDate, 'EEEE')}
        </div>
        <div
          className={`text-2xl font-medium ${
            isToday(currentDate) ? 'text-primary' : ''
          }`}
        >
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border p-2 space-y-1">
          {allDayEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={(e) => onEventClick(event, e)}
              className="w-full rounded px-2 py-1 text-sm text-white text-left"
              style={{
                backgroundColor:
                  event.calendar.color || event.googleAccount.color || '#4285f4',
              }}
            >
              {event.summary || '(No title)'}
              {event.location && (
                <span className="ml-2 text-xs opacity-80">{event.location}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div
        className="grid grid-cols-[60px_1fr] overflow-y-auto max-h-[calc(100vh-300px)]"
        onClick={() => onDayClick(currentDate)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onDayClick(currentDate);
        }}
        role="button"
        tabIndex={0}
      >
        {/* Time labels */}
        <div className="border-r border-border">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-border/50 text-right pr-2 text-xs text-muted-foreground flex items-start justify-end pt-1"
              style={{ height: HOUR_HEIGHT }}
            >
              {hour === 0 ? '' : format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
          ))}
        </div>

        {/* Event column */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-border/50"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}

          {/* Events */}
          {dayEvents.map((event) => {
            const pos = getEventPosition(event);
            return (
              <button
                key={event.id}
                type="button"
                className="absolute left-1 right-1 rounded-md px-3 py-1.5 text-white overflow-hidden cursor-pointer hover:opacity-90 z-10"
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundColor:
                    event.calendar.color ||
                    event.googleAccount.color ||
                    '#4285f4',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event, e);
                }}
              >
                <div className="font-medium truncate text-sm">
                  {event.summary || '(No title)'}
                </div>
                <div className="text-xs opacity-80">
                  {format(parseISO(event.startTime), 'h:mm a')} –{' '}
                  {format(parseISO(event.endTime), 'h:mm a')}
                </div>
                {event.location && (
                  <div className="text-xs opacity-70 mt-0.5 truncate">
                    {event.location}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
