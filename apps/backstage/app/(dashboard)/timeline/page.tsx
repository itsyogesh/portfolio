import { database } from '@packages/db';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../api/_lib/auth';
import { TimelineEntryList } from './components/timeline-entry-list';
import { TimelineForm } from './components/timeline-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Timeline',
  description: 'Manage timeline entries',
};

export default async function TimelinePage() {
  await requireAdminPage();

  const entries = await database.timelineEntry.findMany({
    orderBy: [{ year: 'desc' }, { position: 'asc' }],
  });

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-2">
            Timeline
          </h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} total
          </p>
        </div>
        <TimelineForm />
      </div>

      <TimelineEntryList entries={entries} />
    </div>
  );
}
