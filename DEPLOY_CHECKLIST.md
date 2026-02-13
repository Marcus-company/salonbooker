# Production Deployment Checklist

## Pre-Deploy Requirements

### Environment Variables (Vercel)

Go to: https://vercel.com/dashboard → salonbooker-web → Settings → Environment Variables

Add these variables:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Resend Email
RESEND_API_KEY=your-resend-key
EMAIL_FROM=onboarding@resend.dev

# Twilio SMS
TWILIO_ACCOUNT_SID=AC_xxx_your_account_sid
TWILIO_AUTH_TOKEN=xxx_your_auth_token
TWILIO_PHONE_NUMBER=+31612345678

# Google Calendar
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx_your_client_secret
GOOGLE_REDIRECT_URI=https://salonbooker-web.vercel.app/api/calendar/callback

# App URL
NEXT_PUBLIC_APP_URL=https://salonbooker-web.vercel.app
```

### Database Migrations (Supabase)

Run these SQL files in order in Supabase SQL Editor:

1. ✅ `001_initial_schema.sql` - Base tables
2. ✅ `002_seed_data.sql` - Initial data
3. ✅ `003_webhooks.sql` - Webhook setup
4. ✅ `004_kassa_pos.sql` - Products & transactions
5. ✅ `005_gift_cards.sql` - Gift cards
6. ✅ `006_subscriptions.sql` - Subscriptions

## Deploy Steps

### Step 1: Trigger Deploy
```bash
# Option A: Push to main (if not auto-deployed)
git push origin main

# Option B: Manual deploy in Vercel Dashboard
# 1. Go to Vercel Dashboard
# 2. Select salonbooker-web
# 3. Click "Redeploy"
```

### Step 2: Verify Build
- Check Vercel build logs for errors
- Ensure build completes successfully
- Look for TypeScript errors (should be none)

### Step 3: Post-Deploy Smoke Tests

```bash
# Test main pages
curl -s https://salonbooker-web.vercel.app | head -20
curl -s https://salonbooker-web.vercel.app/admin | head -20
curl -s https://salonbooker-web.vercel.app/afspraak | head -20

# Test API health
curl https://salonbooker-web.vercel.app/api/email
curl https://salonbooker-web.vercel.app/api/sms
```

## Feature Verification

### Core Features
- [ ] Landing Page loads correctly
- [ ] Admin login works
- [ ] Dashboard shows stats
- [ ] Calendar (dag/week/maand) views work
- [ ] Drag & drop agenda items
- [ ] Klanten CRM (lijst + detail)
- [ ] Boekingen beheer
- [ ] Medewerkers rooster

### Payment Features
- [ ] Kassa/POS - product selectie
- [ ] Kassa - BTW berekening
- [ ] Kassa - betaling afhandelen
- [ ] Cadeaubonnen - aanmaken
- [ ] Cadeaubonnen - valideren
- [ ] Abonnementen - verkopen
- [ ] Abonnementen - gebruik 1x

### Integrations (require ENV vars)
- [ ] Email versturen (Resend)
- [ ] SMS notificaties (Twilio)
- [ ] Google Calendar sync
- [ ] Instagram feed (mock data)

### Reports & Analytics
- [ ] Rapporten pagina laadt
- [ ] Marketing pagina werkt
- [ ] Analytics beschikbaar

## Troubleshooting

### Build Errors
```bash
# Check logs in Vercel Dashboard
# Common issues:
# - Missing ENV vars
# - TypeScript errors
# - Missing dependencies
```

### Runtime Errors
```bash
# Check browser console
# Check Vercel Function logs
# Check Supabase logs
```

### Rollback Plan

If deploy fails:
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "Promote to Production"
4. Investigate issue in failed deployment

## Post-Deploy Actions

### Notify Team
- [ ] Team informed deployment is live
- [ ] Marcus notified to test
- [ ] Any issues reported immediately

### Monitor
- [ ] Check Vercel Analytics for errors
- [ ] Monitor Supabase for issues
- [ ] Test critical user flows

## Verification Complete!

When all checkboxes are ticked, the deployment is successful! 🎉

## Contact

Issues? Contact:
- fdmclaw: Available for emergency fixes
- Maestro: Project coordination
