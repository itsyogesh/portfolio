import { database } from '@packages/db';
import { Badge } from '@packages/base/components/ui/badge';
import { ArrowLeft, Calendar, ExternalLink, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createProfileMetadata } from '../../lib/metadata';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const bookmark = await database.bookmark.findFirst({
    where: { id, isPublic: true },
    select: { title: true, summary: true, imageUrl: true },
  });

  if (!bookmark) return {};

  return createProfileMetadata({
    title: bookmark.title,
    description: bookmark.summary || `Read “${bookmark.title}”.`,
    image: bookmark.imageUrl || undefined,
    path: `/bookmarks/${id}`,
  });
}

export default async function BookmarkReaderPage({ params }: PageProps) {
  const { id } = await params;

  const bookmark = await database.bookmark.findUnique({
    where: { id },
  });

  if (!bookmark || !bookmark.isPublic) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-20">
      {/* Back link */}
      <Link
        href="/bookmarks"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookmarks
      </Link>

      {/* Header */}
      <header className="mb-8">
        {bookmark.imageUrl && (
          <img
            src={bookmark.imageUrl}
            alt=""
            className="w-full h-48 object-cover rounded-lg mb-6"
          />
        )}

        <h1 className="font-display text-3xl sm:text-4xl tracking-tight mb-4">
          {bookmark.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {bookmark.author && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {bookmark.author}
            </span>
          )}
          {bookmark.siteName && <span>{bookmark.siteName}</span>}
          {bookmark.savedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(bookmark.savedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Original
          </a>
        </div>

        {/* Tags & category */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">{bookmark.category}</Badge>
          {bookmark.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        {/* AI Summary */}
        {bookmark.summary && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground italic">
              {bookmark.summary}
            </p>
          </div>
        )}
      </header>

      <div className="rounded-lg border border-border/50 bg-muted/20 px-6 py-10 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          This is a saved recommendation. The complete article remains on its
          original publisher's site.
        </p>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
        >
          <ExternalLink className="h-4 w-4" />
          Read the original article
        </a>
      </div>
    </div>
  );
}
