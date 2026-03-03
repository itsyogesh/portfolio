'use client';

import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TimelineForm } from './timeline-form';

type TimelineEntryData = {
  id: string;
  year: string;
  title: string;
  description: string | null;
  position: number;
};

type TimelineEntryListProps = {
  entries: TimelineEntryData[];
};

export function TimelineEntryList({ entries }: TimelineEntryListProps) {
  const router = useRouter();

  const deleteEntry = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete entry');
        return;
      }
      toast.success('Entry deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  // Group entries by year for visual grouping
  const groupedByYear: Record<string, TimelineEntryData[]> = {};
  for (const entry of entries) {
    if (!groupedByYear[entry.year]) {
      groupedByYear[entry.year] = [];
    }
    groupedByYear[entry.year].push(entry);
  }

  const years = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">
          No timeline entries yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="text-sm font-medium px-3 py-1">
              {year}
            </Badge>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="space-y-2 pl-2">
            {groupedByYear[year].map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-3 px-4 border border-border/40 rounded-md hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{entry.title}</p>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {entry.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <TimelineForm entry={entry} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={() => deleteEntry(entry.id, entry.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
