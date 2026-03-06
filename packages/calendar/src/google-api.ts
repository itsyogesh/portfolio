import type {
  GoogleCalendarListEntry,
  GoogleEvent,
  GoogleEventListResponse,
} from './types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

async function calendarFetch<T>(
  accessToken: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${CALENDAR_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 410) {
    throw new SyncTokenExpiredError('Sync token expired (410 GONE)');
  }

  if (response.status === 429 || response.status === 403) {
    const body = await response.text();
    throw new RateLimitError(
      `Rate limited (${response.status}): ${body}`
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Google Calendar API error (${response.status}): ${body}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * List all calendars accessible by the authenticated user.
 */
export async function listCalendars(
  accessToken: string
): Promise<GoogleCalendarListEntry[]> {
  const data = await calendarFetch<{
    items: GoogleCalendarListEntry[];
  }>(accessToken, '/users/me/calendarList');
  return data.items || [];
}

/**
 * List events from a calendar.
 * Use singleEvents=true to expand recurring events (required for orderBy=startTime).
 * Pass syncToken for incremental sync (cannot combine with timeMin/timeMax).
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    syncToken?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<GoogleEventListResponse> {
  const params = new URLSearchParams();

  if (options.syncToken) {
    // Incremental sync — cannot combine with time filters
    params.set('syncToken', options.syncToken);
  } else {
    // Full fetch
    if (options.timeMin) params.set('timeMin', options.timeMin);
    if (options.timeMax) params.set('timeMax', options.timeMax);
    params.set('singleEvents', 'true');
    params.set('orderBy', 'startTime');
  }

  params.set('maxResults', String(options.maxResults || 2500));
  if (options.pageToken) params.set('pageToken', options.pageToken);

  const encodedCalendarId = encodeURIComponent(calendarId);
  return calendarFetch<GoogleEventListResponse>(
    accessToken,
    `/calendars/${encodedCalendarId}/events?${params.toString()}`
  );
}

/**
 * Fetch all pages of events (handles pagination).
 */
export async function listAllEvents(
  accessToken: string,
  calendarId: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    syncToken?: string;
  } = {}
): Promise<{ events: GoogleEvent[]; nextSyncToken?: string }> {
  const allEvents: GoogleEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const response = await listEvents(accessToken, calendarId, {
      ...options,
      pageToken,
    });
    allEvents.push(...(response.items || []));
    pageToken = response.nextPageToken;
    if (!pageToken) {
      nextSyncToken = response.nextSyncToken;
    }
  } while (pageToken);

  return { events: allEvents, nextSyncToken };
}

/**
 * Get a single event by ID.
 */
export async function getEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<GoogleEvent> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const encodedEventId = encodeURIComponent(eventId);
  return calendarFetch<GoogleEvent>(
    accessToken,
    `/calendars/${encodedCalendarId}/events/${encodedEventId}`
  );
}

/**
 * Create a new event on a calendar.
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }
): Promise<GoogleEvent> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  return calendarFetch<GoogleEvent>(
    accessToken,
    `/calendars/${encodedCalendarId}/events?sendUpdates=none`,
    {
      method: 'POST',
      body: JSON.stringify(event),
    }
  );
}

/**
 * Update an existing event (PATCH, not PUT — partial update).
 */
export async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<{
    summary: string;
    description: string;
    location: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
  }>
): Promise<GoogleEvent> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const encodedEventId = encodeURIComponent(eventId);
  return calendarFetch<GoogleEvent>(
    accessToken,
    `/calendars/${encodedCalendarId}/events/${encodedEventId}?sendUpdates=none`,
    {
      method: 'PATCH',
      body: JSON.stringify(event),
    }
  );
}

/**
 * Delete an event from a calendar.
 */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const encodedEventId = encodeURIComponent(eventId);
  await calendarFetch<void>(
    accessToken,
    `/calendars/${encodedCalendarId}/events/${encodedEventId}?sendUpdates=none`,
    { method: 'DELETE' }
  );
}

export class SyncTokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncTokenExpiredError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}
