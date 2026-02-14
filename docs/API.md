# SalonBooker API Documentation

## Overview

SalonBooker is a full-featured salon booking system built with Next.js, Supabase, and modern web technologies.

## Base URL
```
Production: https://salonbooker-web.vercel.app
Local: http://localhost:3000
```

## Authentication

All admin API routes require authentication via Supabase Auth.

```typescript
// Client-side auth check
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  // Redirect to login
}
```

## API Endpoints

### Email

**POST** `/api/email`

Send transactional emails via Resend.

**Request:**
```json
{
  "action": "booking-confirmation",
  "to": "customer@example.com",
  "data": {
    "customerName": "John Doe",
    "serviceName": "Haircut",
    "date": "2026-02-15",
    "time": "14:00"
  }
}
```

**Actions:**
- `test` - Send test email
- `signup` - Signup confirmation
- `password-reset` - Password reset link
- `booking-confirmation` - Booking confirmation
- `welcome` - Welcome email

---

### SMS

**POST** `/api/sms`

Send SMS notifications via Twilio.

**Request:**
```json
{
  "action": "booking-confirmation",
  "to": "+31612345678",
  "data": {
    "service_name": "Knippen",
    "booking_date": "2026-02-15",
    "booking_time": "14:00"
  }
}
```

**Actions:**
- `test` - Send test SMS
- `booking-confirmation` - Booking confirmation
- `booking-reminder` - 24h or 1h reminder
- `booking-cancelled` - Cancellation notice
- `welcome` - Welcome message

---

### Google Calendar

**GET** `/api/calendar/auth`

Get OAuth URL for Google Calendar connection.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/..."
}
```

---

**GET** `/api/calendar/callback?code=xxx&state=userId`

OAuth callback handler.

---

**POST** `/api/calendar/sync`

Sync a booking to Google Calendar.

**Request:**
```json
{
  "bookingId": "uuid"
}
```

---

### Calendar (ICS)

**GET** `/api/calendar?bookingId=uuid`

Download ICS file for a booking.

**Response:** `.ics` file download

---

## Database Schema

### Core Tables

#### bookings
```sql
id: uuid (PK)
customer_name: text
customer_phone: text
customer_email: text
service_name: text
service_duration: text
service_price: decimal
staff_name: text
booking_date: date
booking_time: time
status: text (confirmed|pending|cancelled)
notes: text
created_at: timestamp
```

#### customers
```sql
id: uuid (PK)
name: text
phone: text (unique)
email: text
total_bookings: integer
last_visit: date
notes: jsonb
created_at: timestamp
```

#### staff
```sql
id: uuid (PK)
salon_id: uuid (FK)
name: text
email: text
role: text (admin|staff)
is_active: boolean
auth_user_id: uuid
availability: jsonb
created_at: timestamp
```

#### services
```sql
id: uuid (PK)
salon_id: uuid (FK)
name: text
duration: text
price: decimal
is_active: boolean
created_at: timestamp
```

### Payment Tables

#### products
```sql
id: uuid (PK)
salon_id: uuid (FK)
name: text
price: decimal
stock: integer
category: text
is_active: boolean
```

#### transactions
```sql
id: uuid (PK)
salon_id: uuid (FK)
items: jsonb
subtotal: decimal
tax: decimal
total: decimal
payment_method: text
created_at: timestamp
```

#### gift_cards
```sql
id: uuid (PK)
code: text (unique)
initial_amount: decimal
balance: decimal
status: text
recipient_name: text
recipient_email: text
expires_at: timestamp
```

#### subscriptions
```sql
id: uuid (PK)
name: text
total_sessions: integer
price: decimal
valid_months: integer
is_active: boolean
```

#### customer_subscriptions
```sql
id: uuid (PK)
customer_id: uuid
customer_name: text
subscription_id: uuid
total_sessions: integer
used_sessions: integer
status: text
valid_until: timestamp
```

## Webhooks

### Supabase Webhooks

#### booking_created
Triggered when a new booking is created.

**Payload:**
```json
{
  "type": "INSERT",
  "table": "bookings",
  "record": { ...booking data }
}
```

#### booking_updated
Triggered when a booking status changes.

**Payload:**
```json
{
  "type": "UPDATE",
  "table": "bookings",
  "record": { ...booking data },
  "old_record": { ...old data }
}
```

## Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Resend Email
RESEND_API_KEY=
EMAIL_FROM=

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Slow down requests |
| 500 | Server Error | Contact admin |
| 503 | Service Unavailable | Check ENV vars |

## Rate Limits

- Email: 100/hour
- SMS: 50/hour
- API: 1000/hour

## Support

For issues or questions:
- Check Trello board
- Review CODE_REVIEW.md
- Contact team lead
