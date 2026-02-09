# Email Deliverability Test

## Setup

1. Add your Resend API key to `.env.local`:
```
RESEND_API_KEY=re_your_actual_key_here
```

2. Test email service health:
```bash
curl https://salonbooker-web.vercel.app/api/email
```

3. Send test email:
```bash
curl -X POST https://salonbooker-web.vercel.app/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test",
    "to": "test@marcusfdm.com",
    "template": "welcomeEmail",
    "data": {
      "name": "Marcus",
      "loginUrl": "https://salonbooker-web.vercel.app"
    }
  }'
```

4. Send signup confirmation:
```bash
curl -X POST https://salonbooker-web.vercel.app/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signup",
    "to": "test@marcusfdm.com",
    "data": {
      "name": "Marcus",
      "confirmationUrl": "https://salonbooker-web.vercel.app/login?verified=true"
    }
  }'
```

5. Send password reset:
```bash
curl -X POST https://salonbooker-web.vercel.app/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "action": "password-reset",
    "to": "test@marcusfdm.com",
    "data": {
      "name": "Marcus",
      "resetUrl": "https://salonbooker-web.vercel.app/reset-password?token=xyz"
    }
  }'
```

## Expected Results

- All emails should have high deliverability (Resend)
- Professional Dutch templates
- Mobile-friendly HTML design
- SPF/DKIM configured by Resend

## Production Setup

1. Verify domain in Resend dashboard
2. Update EMAIL_FROM to your domain
3. Add RESEND_API_KEY to Vercel environment variables
