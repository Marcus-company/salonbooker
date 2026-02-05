# Setup Guide for SalonBooker

## Quick Start (for team members)

### 1. Clone the repo
```bash
git clone https://github.com/Marcus-Vu/salonbooker.git
cd salonbooker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

### 4. Run validation
```bash
./scripts/validate.sh
```

### 5. Start development
```bash
npm run dev
```

## Database Setup (CRITICAL - Do this first!)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Note down the URL and anon key

### Step 2: Run Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy and run the SQL
4. Open `supabase/migrations/002_seed_data.sql`
5. Copy and run the SQL

### Step 3: Configure Auth
1. Go to Authentication → Settings
2. Enable Email provider
3. Set Site URL to your domain

### Step 4: Create Test Users
1. Go to Authentication → Users
2. Add test users:
   - Email: josje@hairsalonx.nl (admin)
   - Email: sarah@hairsalonx.nl (staff)
3. Link users to staff records in the staff table

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Validation Checklist

Before saying something is "done", verify:

- [ ] Code compiles without errors
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] Manual test in browser
- [ ] API endpoints work (check /api/health)
- [ ] Error states handled
- [ ] Edge cases tested

## API Endpoints

### Health Check
```
GET /api/health
```
Returns system status and Supabase connection status.

### Bookings
```
GET /api/bookings?status=confirmed&date=2026-02-05
POST /api/bookings
```

## Widget Integration

### Iframe Embed
```html
<iframe 
  src="https://salonbooker.vercel.app/widget/widget.html"
  width="100%"
  height="600"
  frameborder="0">
</iframe>
```

### With Config
```html
<script>
  window.SALONBOOKER_CONFIG = {
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your-anon-key',
    salonId: 'hairsalonx'
  };
</script>
<iframe src="..."></iframe>
```

## Team Workflow

1. **Assign tasks in Trello** - Don't work solo
2. **Get feedback** - Have someone review your code
3. **Run validation** - Use the validate.sh script
4. **Test manually** - Open the app and try it
5. **Update Trello** - Move cards and add comments

## Troubleshooting

### "Invalid Supabase credentials"
- Check .env.local has correct values
- Verify Supabase project is active

### "Build fails"
- Run `npm install` again
- Check for TypeScript errors: `npx tsc --noEmit`

### "Database errors"
- Verify migrations ran successfully
- Check RLS policies are set up

## Emergency Contacts

- **Camilo** (Frontend) - Check Trello for assignments
- **Maestro** (Lead) - Coordinate via group chat
- **fdmclaw** (DevOps) - Deployment issues
