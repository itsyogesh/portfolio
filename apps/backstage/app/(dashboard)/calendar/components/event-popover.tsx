'use client';

import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, ExternalLink, MapPin, Pencil, Trash2, X } from 'lucide-react';
import type { CalendarEventSerialized } from './calendar-view';

export function EventPopover({
  event,
  anchor,
  onClose,
  onEdit,
  onDeleted,
}: {
  event: CalendarEventSerialized;
  anchor: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const isWritable = ['writer', 'owner'].includes(event.calendar.accessRole);

  // Position the popover near the click, but keep it on screen
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(anchor.x, window.innerWidth - 320),
    top: Math.min(anchor.y, window.innerHeight - 300),
    zIndex: 50,
  };

  return (
    <div ref={ref} style={style} className="w-[300px] rounded-lg border border-border bg-background shadow-lg">
      {/* Header */}
      <div
        className="rounded-t-lg px-4 py-2 flex items-center justify-between"
        style={{
          backgroundColor:
            event.calendar.color || event.googleAccount.color || '#4285f4',
        }}
      >
        <span className="text-sm text-white font-medium truncate">
          {event.calendar.summary}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-base leading-tight">
          {event.summary || '(No title)'}
        </h3>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            {event.isAllDay ? (
              <span>All day</span>
            ) : (
              <>
                <div>
                  {format(parseISO(event.startTime), 'EEEE, MMMM d, yyyy')}
                </div>
                <div>
                  {format(parseISO(event.startTime), 'h:mm a')} –{' '}
                  {format(parseISO(event.endTime), 'h:mm a')}
                </div>
              </>
            )}
          </div>
        </div>

        {event.location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{event.googleAccount.googleEmail}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-4 py-2 flex items-center gap-2">
        {event.htmlLink && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google
          </a>
        )}
        <div className="flex-1" />
        {isWritable && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? '...' : 'Delete'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
