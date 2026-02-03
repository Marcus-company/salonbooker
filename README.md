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
- [ ] Supabase Auth integratie
- [ ] Supabase database connectie
- [ ] CRUD operaties voor boekingen
- [ ] Email notificaties
- [ ] Real-time updates

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔗 Links

- **Widget Repo:** `packages/widget`
- **HairsalonX Website:** https://hairsalonx.nl

## 👥 Team

- **Camilo** - Frontend Developer
- **Maestro** - Lead / Coördinator
- **Marcus** - Product Owner

---

*Built with ❤️ for HairsalonX*
