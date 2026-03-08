import { database } from '@packages/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule a Meeting',
  description: 'Book a time to chat',
};

export default async function SchedulePage() {
  const eventTypes = await database.eventType.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      title: true,
      description: true,
      durationMinutes: true,
      color: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (eventTypes.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No event types available.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight mb-2">
        Schedule a Meeting
      </h1>
      <p className="text-muted-foreground mb-8">
        Pick an event type to find a time.
      </p>

      <div className="space-y-4">
        {eventTypes.map((et) => (
          <Link
            key={et.slug}
            href={`/schedule/${et.slug}`}
            className="block rounded-lg border border-border/50 p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {et.color && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: et.color }}
                />
              )}
              <div>
                <h2 className="font-semibold">{et.title}</h2>
                {et.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {et.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {et.durationMinutes} minutes
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
