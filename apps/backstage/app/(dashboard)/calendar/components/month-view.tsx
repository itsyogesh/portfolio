'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  format,
  parseISO,
} from 'date-fns';
import type { CalendarEventSerialized } from './calendar-view';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_EVENTS = 3;

export function MonthView({
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
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      const start = parseISO(e.startTime);
      const end = parseISO(e.endTime);
      if (e.isAllDay) {
        // All-day events use exclusive end date from Google — half-open [start, end)
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        return start < dayEnd && end > dayStart;
      }
      // Timed events: spans this day
      return (
        isSameDay(start, day) ||
        (start < day && end > day) ||
        isSameDay(end, day)
      );
    });

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border-b border-r border-border p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                !inMonth ? 'bg-muted/10' : ''
              }`}
              onClick={() => onDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onDayClick(day);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex justify-between px-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    today
                      ? 'bg-primary text-primary-foreground font-bold'
                      : inMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-tight text-white transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor:
                        event.calendar.color ||
                        event.googleAccount.color ||
                        '#4285f4',
                    }}
                    onClick={(e) => onEventClick(event, e)}
                    title={event.summary || '(No title)'}
                  >
                    {event.isAllDay
                      ? event.summary || '(No title)'
                      : `${format(parseISO(event.startTime), 'h:mm a')} ${event.summary || ''}`}
                  </button>
                ))}
                {dayEvents.length > MAX_VISIBLE_EVENTS && (
                  <div className="px-1.5 text-[10px] text-muted-foreground">
                    +{dayEvents.length - MAX_VISIBLE_EVENTS} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
