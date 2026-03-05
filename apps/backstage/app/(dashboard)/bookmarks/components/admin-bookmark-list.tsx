'use client';

import { Badge } from '@packages/base/components/ui/badge';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AdminBookmark = {
  id: string;
  title: string;
  url: string;
  category: string;
  isPublic: boolean;
  isFeatured: boolean;
  extractionStatus: string;
  aiStatus: string;
  savedAt: string | null;
  createdAt: string;
};

type AdminBookmarkListProps = {
  bookmarks: AdminBookmark[];
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    done: 'default',
    pending: 'outline',
    processing: 'secondary',
    failed: 'destructive',
  };

  return (
    <Badge variant={variants[status] || 'outline'} className="text-[10px]">
      {status}
    </Badge>
  );
}

export function AdminBookmarkList({ bookmarks }: AdminBookmarkListProps) {
  const router = useRouter();

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    await fetch(`/api/bookmarks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    router.refresh();
  };

  const deleteBookmark = async (id: string) => {
    if (!confirm('Delete this bookmark?')) return;
    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="space-y-1">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-center gap-3 py-2 px-3 border-b border-border/30 hover:bg-muted/30 rounded-sm transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{bookmark.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px]">
                {bookmark.category}
              </Badge>
              <StatusBadge status={bookmark.extractionStatus} />
              <StatusBadge status={bookmark.aiStatus} />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleVisibility(bookmark.id, bookmark.isPublic)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={bookmark.isPublic ? 'Make private' : 'Make public'}
            >
              {bookmark.isPublic ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => deleteBookmark(bookmark.id)}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
