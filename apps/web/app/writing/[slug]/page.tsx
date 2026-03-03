import { blog } from '@packages/cms';
import { Body } from '@packages/cms/components/body';
import { CodeBlock } from '@packages/cms/components/code-block';
import { createMetadata } from '@packages/seo/metadata';
import { JsonLd } from '@packages/seo/json-ld';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProfile } from '../../lib/profile';

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = () =>
  blog.getPosts().map((p) => ({ slug: p._slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const post = blog.getPost(slug);
  if (!post) return {};
  return createMetadata({
    title: post._title,
    description: post.description,
  });
};

const ArticlePage = async ({ params }: Props) => {
  const { slug } = await params;
  const [post, profile] = await Promise.all([
    Promise.resolve(blog.getPost(slug)),
    getProfile(),
  ]);
  if (!post) notFound();

  const authorName = profile?.name || 'Yogesh Kumar';
  const authorUrl = profile?.website || 'https://itsyogesh.fyi';

  return (
    <>
      <JsonLd
        code={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post._title,
          description: post.description,
          datePublished: post.date,
          author: {
            '@type': 'Person',
            name: authorName,
            url: authorUrl,
          },
        }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <Link
          href="/writing"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to writing
        </Link>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            {post._title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={post.date}>
              {format(new Date(post.date), 'MMMM d, yyyy')}
            </time>
            <span>&middot;</span>
            <span>{post.readingTime} min read</span>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <Body
            content={post.body}
            components={{ pre: CodeBlock }}
          />
        </article>
      </div>
    </>
  );
};

export default ArticlePage;
