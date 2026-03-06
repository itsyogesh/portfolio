'use client';

import { useState, useMemo } from 'react';
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { CalendarHeader } from './calendar-header';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { DayView } from './day-view';
import { EventPopover } from './event-popover';
import { EventFormDialog } from './event-form-dialog';
import { CalendarSettingsSheet } from './calendar-settings-sheet';

export interface CalendarEventSerialized {
  id: string;
  googleEventId: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  status: string;
  htmlLink: string | null;
  calendarId: string;
  googleAccountId: string;
  calendar: {
    summary: string;
    color: string | null;
    accessRole: string;
    googleAccountId: string;
  };
  googleAccount: {
    googleEmail: string;
    color: string;
    displayName: string | null;
  };
}

export interface AccountSerialized {
  id: string;
  googleEmail: string;
  displayName: string | null;
  status: string;
  color: string;
  calendars: Array<{
    id: string;
    googleCalendarId: string;
    summary: string;
    color: string | null;
    isVisible: boolean;
    isPrimary: boolean;
    accessRole: string;
  }>;
}

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView({
  events: initialEvents,
  accounts: initialAccounts,
}: {
  events: CalendarEventSerialized[];
  accounts: AccountSerialized[];
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(initialEvents);
  const [accounts] = useState(initialAccounts);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventSerialized | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEventSerialized | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const fn = direction === 'prev' ? { month: subMonths, week: subWeeks, day: subDays } : { month: addMonths, week: addWeeks, day: addDays };
    setCurrentDate(fn[viewMode](currentDate, 1));
  };

  const handleEventClick = (
    event: CalendarEventSerialized,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setPopoverAnchor({ x: e.clientX, y: e.clientY });
  };

  const handleDayClick = (date: Date) => {
    setNewEventDate(date);
    setEditEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: CalendarEventSerialized) => {
    setSelectedEvent(null);
    setPopoverAnchor(null);
    setEditEvent(event);
    setShowEventForm(true);
  };

  const handleEventSaved = async () => {
    setShowEventForm(false);
    setEditEvent(null);
    setNewEventDate(null);
    // Refresh events from server
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // Fall back to page reload
      window.location.reload();
    }
  };

  const handleEventDeleted = async () => {
    setSelectedEvent(null);
    setPopoverAnchor(null);
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      window.location.reload();
    }
  };

  const writableCalendars = useMemo(
    () =>
      accounts.flatMap((a) =>
        a.calendars
          .filter((c) => ['writer', 'owner'].includes(c.accessRole))
          .map((c) => ({ ...c, accountColor: a.color, accountEmail: a.googleEmail }))
      ),
    [accounts]
  );

  return (
    <div className="space-y-4">
      <CalendarHeader
        viewMode={viewMode}
        currentDate={currentDate}
        onViewChange={setViewMode}
        onNavigate={navigate}
        onNewEvent={() => {
          setEditEvent(null);
          setNewEventDate(new Date());
          setShowEventForm(true);
        }}
        onOpenSettings={() => setShowSettings(true)}
        accountCount={accounts.length}
      />

      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      )}

      {selectedEvent && popoverAnchor && (
        <EventPopover
          event={selectedEvent}
          anchor={popoverAnchor}
          onClose={() => {
            setSelectedEvent(null);
            setPopoverAnchor(null);
          }}
          onEdit={() => handleEditEvent(selectedEvent)}
          onDeleted={handleEventDeleted}
        />
      )}

      {showEventForm && (
        <EventFormDialog
          open={showEventForm}
          onClose={() => {
            setShowEventForm(false);
            setEditEvent(null);
            setNewEventDate(null);
          }}
          event={editEvent}
          defaultDate={newEventDate}
          calendars={writableCalendars}
          onSaved={handleEventSaved}
        />
      )}

      <CalendarSettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        accounts={accounts}
      />
    </div>
  );
}
