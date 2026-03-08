import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Confirmed',
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ time?: string; name?: string }>;
}) {
  const { time, name } = await searchParams;

  const startTime = time ? new Date(decodeURIComponent(time)) : null;

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="font-display text-2xl tracking-tight mb-2">
        Booking Confirmed!
      </h1>
      <p className="text-muted-foreground">
        {name && `Thanks, ${decodeURIComponent(name)}! `}
        Your meeting has been scheduled
        {startTime && (
          <>
            {' '}for{' '}
            <span className="font-medium text-foreground">
              {startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              at{' '}
              {startTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </>
        )}
        .
      </p>

      <p className="text-sm text-muted-foreground mt-4">
        A calendar invitation has been sent to your email.
      </p>

      <div className="mt-8">
        <a
          href="/schedule"
          className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          Schedule another meeting
        </a>
      </div>
    </div>
  );
}
