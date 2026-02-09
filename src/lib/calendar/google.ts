import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
)

const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

// Scopes needed for calendar access
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

// Generate OAuth URL for user
export function getAuthUrl(state?: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state,
  })
}

// Exchange code for tokens
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

// Set credentials from stored tokens
export function setCredentials(tokens: {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
}) {
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  })
}

// Create calendar event for booking
export async function createCalendarEvent(
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  booking: {
    summary: string
    description?: string
    startTime: string
    endTime: string
    location?: string
    attendeeEmail?: string
  }
) {
  setCredentials(tokens)

  const event = {
    summary: booking.summary,
    description: booking.description,
    start: {
      dateTime: booking.startTime,
      timeZone: 'Europe/Amsterdam',
    },
    end: {
      dateTime: booking.endTime,
      timeZone: 'Europe/Amsterdam',
    },
    location: booking.location,
    attendees: booking.attendeeEmail ? [{ email: booking.attendeeEmail }] : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    sendUpdates: 'all', // Send email to attendee
  })

  return response.data
}

// Delete calendar event
export async function deleteCalendarEvent(
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  eventId: string
) {
  setCredentials(tokens)
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  })
}

// Refresh access token if expired
export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

// Save tokens to database
export async function saveUserCalendarTokens(
  userId: string,
  tokens: {
    access_token?: string | null
    refresh_token?: string | null
    expiry_date?: number | null
  }
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_calendar_connections')
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  if (error) throw error
}

// Get tokens from database
export async function getUserCalendarTokens(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()

  if (error) return null
  return data
}

export { oauth2Client, calendar }
