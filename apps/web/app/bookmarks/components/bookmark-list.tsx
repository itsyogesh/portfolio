'use client';

import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import { Skeleton } from '@packages/base/components/ui/skeleton';
import { Archive, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  originalUrl: string | null;
  archived: boolean;
  category: string;
  tags: string[];
  summary: string | null;
  siteName: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  savedAt: string | null;
  extractionStatus: string;
};

type BookmarkListProps = {
  initialBookmarks: Bookmark[];
  totalPages: number;
  currentPage: number;
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function BookmarkList({
  initialBookmarks,
  totalPages,
  currentPage,
}: BookmarkListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    startTransition(() => {
      router.push(`/bookmarks?${params.toString()}`);
    });
  };

  return (
    <div>
      <div className="space-y-0.5">
        {initialBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="group flex items-start justify-between py-2.5 border-b border-border/30 hover:border-border transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {bookmark.extractionStatus === 'done' && bookmark.summary ? (
                  <Link
                    href={`/bookmarks/${bookmark.id}`}
                    className="text-sm text-foreground group-hover:text-foreground/80 line-clamp-1"
                  >
                    {bookmark.title}
                  </Link>
                ) : (
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground group-hover:text-foreground/80 line-clamp-1"
                  >
                    {bookmark.title}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground/50 truncate">
                  {getDomain(
                    bookmark.archived
                      ? bookmark.originalUrl || bookmark.url
                      : bookmark.url
                  )}
                </span>
                {bookmark.archived && (
                  <Archive className="h-3 w-3 text-amber-500/60 shrink-0" />
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {bookmark.category}
                </Badge>
                {bookmark.summary && (
                  <span className="text-xs text-muted-foreground/40 truncate hidden sm:inline max-w-[200px]">
                    {bookmark.summary}
                  </span>
                )}
                {bookmark.savedAt && (
                  <span className="text-xs text-muted-foreground/30 shrink-0 hidden sm:inline">
                    {formatDate(bookmark.savedAt)}
                  </span>
                )}
              </div>
            </div>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 mt-1.5 ml-3"
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </a>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${currentPage} / ${totalPages}`
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export function BookmarkListSkeleton() {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="flex items-start justify-between py-2.5 border-b border-border/30"
        >
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
