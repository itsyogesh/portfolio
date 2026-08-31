'use client';

import { format, startOfWeek, endOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarHeader({
  viewMode,
  currentDate,
  onViewChange,
  onNavigate,
  onNewEvent,
  onOpenSettings,
  accountCount,
}: {
  viewMode: ViewMode;
  currentDate: Date;
  onViewChange: (mode: ViewMode) => void;
  onNavigate: (dir: 'prev' | 'next' | 'today') => void;
  onNewEvent: () => void;
  onOpenSettings: () => void;
  accountCount: number;
}) {
  const getTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week': {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`;
        }
        return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl tracking-tight">{getTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Navigation */}
        <div className="flex items-center rounded-md border border-border">
          <button
            type="button"
            onClick={() => onNavigate('prev')}
            className="p-1.5 hover:bg-muted rounded-l-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('today')}
            className="px-3 py-1 text-sm hover:bg-muted border-x border-border"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onNavigate('next')}
            className="p-1.5 hover:bg-muted rounded-r-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-border">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewChange(mode)}
              className={`px-3 py-1 text-sm capitalize ${
                viewMode === mode
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted/50'
              } ${mode === 'month' ? 'rounded-l-md' : ''} ${
                mode === 'day' ? 'rounded-r-md' : ''
              } ${mode !== 'day' ? 'border-r border-border' : ''}`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="relative rounded-md border border-border p-1.5 hover:bg-muted"
          title="Calendar settings"
        >
          <Settings className="h-4 w-4" />
          {accountCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {accountCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onNewEvent}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Event
        </button>
      </div>
    </div>
  );
}
