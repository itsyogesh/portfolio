// Google Account types
export interface GoogleAccountData {
  id: string;
  googleEmail: string;
  googleAccountId: string;
  displayName: string | null;
  status: 'active' | 'revoked' | 'error';
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Google Calendar types
export interface GoogleCalendarData {
  id: string;
  googleCalendarId: string;
  summary: string;
  color: string | null;
  isVisible: boolean;
  isPrimary: boolean;
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  syncToken: string | null;
  lastSyncedAt: Date | null;
  googleAccountId: string;
}

// Calendar Event types
export interface CalendarEvent {
  id: string;
  googleEventId: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string | null;
  calendarId: string;
  googleAccountId: string;
}

// Google API response types
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole: string;
}

export interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  attendees?: Array<{ email: string; responseStatus?: string }>;
}

export interface GoogleEventListResponse {
  items: GoogleEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
}

// Event Type / Scheduling types
export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface AvailabilitySchedule {
  [dayOfWeek: number]: TimeSlot[]; // 0=Sunday, 6=Saturday
}

export interface AvailableSlot {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

export interface BookingRequest {
  bookerName: string;
  bookerEmail: string;
  bookerTimezone: string;
  startTime: string;
  notes?: string;
  idempotencyKey: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  calendarId: string;
  googleAccountId: string;
}
