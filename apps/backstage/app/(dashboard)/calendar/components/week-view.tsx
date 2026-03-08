'use client';

import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  startOfDay,
} from 'date-fns';
import type { CalendarEventSerialized } from './calendar-view';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 0;

export function WeekView({
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
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      if (e.isAllDay) return false;
      // Include events that overlap this day (handles overnight/multi-day timed events)
      const start = parseISO(e.startTime);
      const end = parseISO(e.endTime);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      return start < dayEnd && end > dayStart;
    });

  const getAllDayEvents = (day: Date) =>
    events.filter((e) => {
      if (!e.isAllDay) return false;
      // All-day events use exclusive end date — half-open [start, end)
      const start = parseISO(e.startTime);
      const end = parseISO(e.endTime);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      return start < dayEnd && end > dayStart;
    });

  const getEventPosition = (event: CalendarEventSerialized, day: Date) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    // Clamp to current day boundaries for overnight events
    const clampedStart = start < dayStart ? dayStart : start;
    const clampedEnd = end > dayEnd ? dayEnd : end;
    const topMinutes = differenceInMinutes(clampedStart, dayStart);
    const durationMinutes = differenceInMinutes(clampedEnd, clampedStart);
    return {
      top: (topMinutes / 60) * HOUR_HEIGHT,
      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20),
    };
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* All-day events row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30">
        <div className="border-r border-border p-1 text-[10px] text-muted-foreground" />
        {days.map((day) => {
          const allDay = getAllDayEvents(day);
          return (
            <div
              key={day.toISOString()}
              className="border-r border-border p-1 min-h-[28px]"
            >
              {allDay.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={(e) => onEventClick(event, e)}
                  className="w-full truncate rounded px-1 py-0.5 text-[10px] text-white mb-0.5"
                  style={{
                    backgroundColor:
                      event.calendar.color || event.googleAccount.color || '#4285f4',
                  }}
                >
                  {event.summary || '(No title)'}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="border-r border-border" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`border-r border-border px-2 py-2 text-center ${
              isToday(day) ? 'bg-primary/5' : ''
            }`}
          >
            <div className="text-xs text-muted-foreground">
              {format(day, 'EEE')}
            </div>
            <div
              className={`text-lg font-medium ${
                isToday(day) ? 'text-primary' : ''
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto max-h-[calc(100vh-300px)]">
        {/* Time labels */}
        <div className="border-r border-border">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-border/50 text-right pr-2 text-[10px] text-muted-foreground"
              style={{ height: HOUR_HEIGHT }}
            >
              {hour === 0
                ? ''
                : format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`relative border-r border-border ${
                isToday(day) ? 'bg-primary/5' : ''
              }`}
              onClick={() => onDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onDayClick(day);
              }}
              role="button"
              tabIndex={0}
            >
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/50"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {/* Events */}
              {dayEvents.map((event) => {
                const pos = getEventPosition(event, day);
                return (
                  <button
                    key={event.id}
                    type="button"
                    className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-[11px] text-white overflow-hidden cursor-pointer hover:opacity-90 z-10"
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
                    <div className="font-medium truncate">
                      {event.summary || '(No title)'}
                    </div>
                    <div className="text-[10px] opacity-80">
                      {format(parseISO(event.startTime), 'h:mm a')} –{' '}
                      {format(parseISO(event.endTime), 'h:mm a')}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
