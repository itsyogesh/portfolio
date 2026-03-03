import { database } from '@packages/db';
import { Badge } from '@packages/base/components/ui/badge';
import { createMetadata } from '@packages/seo/metadata';
import { ArrowLeft, Calendar, ExternalLink, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const bookmark = await database.bookmark.findUnique({
    where: { id },
    select: { title: true, summary: true, imageUrl: true },
  });

  if (!bookmark) return {};

  return createMetadata({
    title: bookmark.title,
    description: bookmark.summary || `Read "${bookmark.title}" on itsyogesh.fyi`,
    image: bookmark.imageUrl || undefined,
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

  const hasContent = bookmark.fullText && bookmark.extractionStatus === 'done';

  const sanitizedContent = hasContent
    ? sanitizeHtml(bookmark.fullText!, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'img',
          'figure',
          'figcaption',
          'picture',
          'source',
          'video',
          'audio',
          'pre',
          'code',
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'width', 'height', 'loading'],
          a: ['href', 'target', 'rel'],
          code: ['class'],
          pre: ['class'],
        },
        allowedSchemes: ['http', 'https'],
      })
    : null;

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

      {/* Article content */}
      {sanitizedContent ? (
        <article
          className="prose prose-neutral dark:prose-invert max-w-none prose-sm prose-headings:font-display prose-a:text-foreground prose-a:underline-offset-4"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {bookmark.extractionStatus === 'pending'
              ? 'Article content is being processed...'
              : bookmark.extractionStatus === 'failed'
                ? 'Could not extract article content.'
                : 'No readable content available for this bookmark.'}
          </p>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-foreground hover:text-foreground/80 transition-colors underline underline-offset-4"
          >
            <ExternalLink className="h-4 w-4" />
            Read on original site
          </a>
        </div>
      )}
    </div>
  );
}
