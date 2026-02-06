# Webhook Integratie

Real-time webhook system voor SalonBooker dat externe systemen op de hoogte stelt van boekingswijzigingen.

## Features

- **Real-time updates** - Ontvang direct notificaties bij nieuwe/wijzigde afspraken
- **HMAC beveiliging** - Elke webhook is voorzien van een signature voor verificatie
- **Automatische retries** - Mislukt deliveries worden automatisch opnieuw geprobeerd (max 5x)
- **Event filtering** - Kies welke events je wilt ontvangen
- **Delivery logs** - Volledige historie van alle webhook calls

## Ondersteunde Events

| Event | Beschrijving |
|-------|-------------|
| `booking.created` | Nieuwe afspraak aangemaakt |
| `booking.updated` | Afspraak gewijzigd |
| `booking.cancelled` | Afspraak geannuleerd |
| `*` | Alle events |

## Webhook Payload Format

```json
{
  "event": "booking.created",
  "timestamp": "2026-02-06T21:57:00.000Z",
  "data": {
    "id": "uuid",
    "customer_name": "Jan Jansen",
    "customer_phone": "+31612345678",
    "customer_email": "jan@example.com",
    "service_name": "Knippen dames",
    "booking_date": "2026-02-10",
    "booking_time": "14:00",
    "status": "pending",
    "created_at": "2026-02-06T21:57:00.000Z"
  }
}
```

## Security

### HMAC Signature Verificatie

Elke webhook bevat een `X-Webhook-Signature` header met een HMAC-SHA256 hash:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Headers

| Header | Beschrijving |
|--------|-------------|
| `X-Webhook-Signature` | HMAC-SHA256 signature |
| `X-Webhook-Event` | Event type (bijv. `booking.created`) |
| `X-Webhook-Timestamp` | ISO timestamp van het event |
| `User-Agent` | `SalonBooker-Webhook/1.0` |

## API Endpoints

### Webhooks beheren

| Methode | Endpoint | Beschrijving |
|---------|----------|-------------|
| GET | `/api/webhooks` | Lijst van webhooks |
| POST | `/api/webhooks` | Nieuwe webhook aanmaken |
| GET | `/api/webhooks/[id]` | Webhook details |
| PATCH | `/api/webhooks/[id]` | Webhook wijzigen |
| DELETE | `/api/webhooks/[id]` | Webhook verwijderen |
| POST | `/api/webhooks/test/[id]` | Webhook testen |

### Processing

| Methode | Endpoint | Beschrijving |
|---------|----------|-------------|
| GET | `/api/webhooks/process` | Stats bekijken |
| POST | `/api/webhooks/process` | Pending deliveries verwerken |

## Database Schema

### webhooks tabel

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  salon_id UUID REFERENCES salons(id),
  name VARCHAR(255),
  url TEXT,
  secret TEXT,
  events TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### webhook_deliveries tabel

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id),
  event TEXT,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## Setup

1. **Database migratie uitvoeren:**
   ```bash
   # Voer 003_webhooks.sql uit in Supabase SQL Editor
   ```

2. **Cron job instellen (optioneel):**
   ```bash
   # Roep elke 5 minuten de process endpoint aan
   curl -X POST https://salonbooker.vercel.app/api/webhooks/process \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. **Environment variable:**
   ```
   CRON_SECRET=your-secret-key-here
   ```

## Retry Logic

- Maximaal 5 pogingen
- Exponentiële backoff
- Mislukt na 5 pogingen = handmatige interventie nodig

## Admin Interface

Beschikbaar op `/admin/webhooks`:
- Webhooks aanmaken/bewerken/verwijderen
- Events selecteren
- Test webhook versturen
- Active/inactive schakelen

## Voorbeeld Implementatie (Node.js)

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  // Verify signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )) {
    return res.status(401).send('Invalid signature');
  }
  
  const payload = JSON.parse(req.body);
  
  // Handle event
  switch (payload.event) {
    case 'booking.created':
      console.log('New booking:', payload.data);
      break;
    case 'booking.cancelled':
      console.log('Cancelled:', payload.data);
      break;
  }
  
  res.status(200).send('OK');
});

app.listen(3000);
```
