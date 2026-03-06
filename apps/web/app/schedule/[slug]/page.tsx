import { database } from '@packages/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BookingClient } from './booking-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eventType = await database.eventType.findUnique({
    where: { slug, isActive: true },
    select: { title: true, description: true },
  });

  return {
    title: eventType?.title || 'Schedule',
    description: eventType?.description || 'Book a time',
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const eventType = await database.eventType.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      durationMinutes: true,
      color: true,
      timezone: true,
      minNotice: true,
      maxFutureDays: true,
    },
  });

  if (!eventType) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <BookingClient eventType={eventType} />
    </div>
  );
}
