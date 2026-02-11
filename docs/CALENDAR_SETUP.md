# Google Calendar Sync Setup

## Overview
Complete Google Calendar integration for syncing salon bookings.

## Files Created

### API Routes
- `/api/calendar/auth` - Start OAuth flow
- `/api/calendar/callback` - Handle OAuth callback
- `/api/calendar/sync` - Sync booking to calendar
- `/api/calendar` - Download ICS file

### Library
- `/lib/calendar/google.ts` - Google Calendar API functions
- `/lib/calendar/icsGenerator.ts` - ICS file generation

## Setup Instructions

### 1. Google Cloud Console
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://yourdomain.com/api/calendar/callback`

### 2. Environment Variables
Add to Vercel:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://salonbooker-web.vercel.app/api/calendar/callback
```

### 3. Database Migration
Run this SQL in Supabase:
```sql
-- Calendar connections table
CREATE TABLE IF NOT EXISTS user_calendar_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add calendar_event_id to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMP;
```

## Features

### For Staff
- Connect personal Google Calendar
- Auto-sync new bookings
- Booking reminders (24h + 30min)

### For Customers
- Download ICS file from booking confirmation
- Add to personal calendar

## Usage

### Connect Calendar
```typescript
const { authUrl } = await fetch('/api/calendar/auth').then(r => r.json())
window.location.href = authUrl
```

### Sync Booking
```typescript
await fetch('/api/calendar/sync', {
  method: 'POST',
  body: JSON.stringify({ bookingId: '...' })
})
```

### Check Status
```typescript
const { connected } = await fetch('/api/calendar/sync').then(r => r.json())
```

## Error Handling
- Token refresh on expiry
- Graceful degradation if Google API fails
- Clear error messages for users
