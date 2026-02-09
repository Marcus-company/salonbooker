# SMS Notificaties Test

## Setup

1. Add your Twilio credentials to `.env.local`:
```
TWILIO_ACCOUNT_SID=AC_your_actual_sid
TWILIO_AUTH_TOKEN=your_actual_token
TWILIO_PHONE_NUMBER=+31612345678
```

2. Get Twilio credentials from: https://console.twilio.com

## Test Commands

### Health check
```bash
curl https://salonbooker-web.vercel.app/api/sms
```

### Send test SMS
```bash
curl -X POST https://salonbooker-web.vercel.app/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test",
    "to": "+31612345678",
    "message": "🧪 SalonBooker SMS Test!"
  }'
```

### Send booking confirmation
```bash
curl -X POST https://salonbooker-web.vercel.app/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "action": "booking-confirmation",
    "to": "+31612345678",
    "data": {
      "service_name": "Knippen dames",
      "booking_date": "2026-02-10",
      "booking_time": "14:00"
    }
  }'
```

### Send 24h reminder
```bash
curl -X POST https://salonbooker-web.vercel.app/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "action": "booking-reminder",
    "to": "+31612345678",
    "data": {
      "service_name": "Knippen dames",
      "booking_date": "2026-02-10",
      "booking_time": "14:00"
    },
    "hoursBefore": 24
  }'
```

### Send cancellation
```bash
curl -X POST https://salonbooker-web.vercel.app/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "action": "booking-cancelled",
    "to": "+31612345678",
    "data": {
      "service_name": "Knippen dames",
      "booking_date": "2026-02-10",
      "booking_time": "14:00"
    }
  }'
```

## Dutch SMS Templates

- ✅ Booking confirmation
- ⏰ 24h reminder
- ⏰ 1h reminder
- ❌ Cancellation notice
- 👋 Welcome message

## Cron Job Setup (for automatic reminders)

Set up a cron job to check for upcoming bookings and send reminders:

```javascript
// Runs every hour
0 * * * * curl -X POST https://salonbooker-web.vercel.app/api/cron/reminders
```

Or use Vercel Cron Jobs (vercel.json).
