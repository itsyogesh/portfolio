'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@packages/base/components/ui/button';
import { Badge } from '@packages/base/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, ExternalLink, Star } from 'lucide-react';
import { ExternalWritingForm } from './external-writing-form';

interface ExternalWriting {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  summary: string | null;
  tags: string[];
  imageUrl: string | null;
  featured: boolean;
  position: number;
}

const SOURCE_COLORS: Record<string, string> = {
  substack: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  medium: 'bg-neutral-500/20 text-neutral-600 dark:text-neutral-300 border-neutral-500/30',
  twitter: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  devto: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  hashnode: 'bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-600/30',
  youtube: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  other: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
};

export function ExternalWritingTable() {
  const [writings, setWritings] = useState<ExternalWriting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWritings = useCallback(async () => {
    try {
      const response = await fetch('/api/writing');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setWritings(data);
    } catch {
      toast.error('Failed to load external writing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWritings();
  }, [fetchWritings]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/writing/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      toast.success('External writing deleted');
      fetchWritings();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading external writing...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {writings.length} external {writings.length === 1 ? 'article' : 'articles'}
        </p>
        <ExternalWritingForm onSuccess={fetchWritings} />
      </div>

      {writings.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
          No external writing yet. Add your first entry.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {writings.map((writing) => (
            <div
              key={writing.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {writing.title}
                  </span>
                  {writing.featured && (
                    <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {writing.source && (
                    <Badge
                      variant="outline"
                      className={SOURCE_COLORS[writing.source] || SOURCE_COLORS.other}
                    >
                      {writing.source}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(writing.publishedAt)}
                  </span>
                  {writing.tags.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {writing.tags.slice(0, 3).join(', ')}
                      {writing.tags.length > 3 && ` +${writing.tags.length - 3}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={writing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <ExternalWritingForm
                  writing={{
                    ...writing,
                    publishedAt: writing.publishedAt
                      ? new Date(writing.publishedAt).toISOString()
                      : null,
                  }}
                  onSuccess={fetchWritings}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(writing.id)}
                  disabled={deletingId === writing.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
