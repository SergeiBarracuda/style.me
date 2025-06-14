# Beauty Service Marketplace

Kompletní webová aplikace pro propojení poskytovatelů kosmetických služeb s klienty.

## 📁 Struktura projektu

```
beauty-marketplace/
├── frontend/          # Next.js React aplikace
│   ├── components/    # React komponenty
│   ├── pages/         # Next.js stránky
│   ├── styles/        # CSS styly
│   ├── package.json   # Frontend závislosti
│   └── Procfile       # Heroku konfigurace
├── backend/           # Node.js Express API
│   ├── routes/        # API routes
│   ├── models/        # MongoDB modely
│   ├── controllers/   # Business logika
│   ├── middleware/    # Express middleware
│   ├── scripts/       # Utility skripty
│   ├── server.js      # Hlavní server soubor
│   ├── package.json   # Backend závislosti
│   └── Procfile       # Heroku konfigurace
└── docs/              # Dokumentace
```

## 🚀 Rychlé spuštění

### Lokální vývoj

1. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Upravte .env s vašimi údaji
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Upravte .env.local s vašimi údaji
   npm run dev
   ```

### Produkční nasazení

Viz podrobný návod v `docs/deployment-guide.md`

## 🔧 Technologie

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Deployment**: Heroku, MongoDB Atlas
- **Maps**: Google Maps API
- **Payments**: Stripe

## 📚 Dokumentace

- [Deployment Guide](docs/deployment-guide.md) - Podrobný návod pro nasazení
- [API Documentation](docs/api-documentation.md) - API endpoints
- [User Guide](docs/user-guide.md) - Návod pro uživatele

## 🔑 Požadované API klíče

1. **MongoDB Atlas** - Databáze
2. **Google Maps API** - Mapy a geolokace
3. **Stripe** - Platby (volitelné)

## 📞 Podpora

Pro technickou podporu kontaktujte vývojový tým.

