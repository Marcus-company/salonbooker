# SalonBooker Admin Dashboard

Admin dashboard voor HairsalonX - Boekingssysteem voor kapsalons.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Auth:** (to be implemented - Supabase Auth)
- **Database:** (to be implemented - Supabase)

## 📁 Projectstructuur

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx      # Admin layout met sidebar
│   │   ├── page.tsx        # Dashboard overzicht
│   │   ├── bookingen/
│   │   │   └── page.tsx    # Boekingen beheer
│   │   └── instellingen/
│   │       └── page.tsx    # Openingstijden & behandelingen
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Login pagina
│   └── globals.css         # Global styles
└── components/             # Gedeelde componenten
```

## ✨ Features

### Geïmplementeerd
- ✅ Login pagina (UI)
- ✅ Admin layout met navigatie
- ✅ Dashboard overzicht (stats, recente boekingen)
- ✅ Boekingen tabel met filters
- ✅ Openingstijden instellingen
- ✅ Behandelingen beheer

### TODO
- [x] Supabase Auth integratie ✅
- [x] Supabase database connectie ✅
- [x] CRUD operaties voor boekingen ✅
- [x] Email notificaties (Resend) ✅
- [x] Real-time updates ✅

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🗄️ Database Setup

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor → New Query
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`

### Environment Variables

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Required Tables

- **salons** - Salon information
- **services** - Available services/treatments
- **staff** - Staff members with roles (admin/staff)
- **bookings** - Customer appointments

## 🔗 Links

- **Widget Repo:** `packages/widget`
- **HairsalonX Website:** https://hairsalonx.nl

## 👥 Team

- **Camilo** - Frontend Developer
- **Maestro** - Lead / Coördinator
- **Marcus** - Product Owner

---

*Built with ❤️ for HairsalonX*
