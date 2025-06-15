# Kompletní návod pro nasazení Beauty Service Marketplace

## 📋 Přehled

Tento návod vás provede kompletním procesem nasazení Beauty Service Marketplace aplikace do produkce pomocí Heroku a MongoDB Atlas. Aplikace bude dostupná online pro testování s přáteli a rodinou.

## ⏱️ Odhadovaný čas: 30-45 minut

## 🎯 Co budete potřebovat

### Účty (všechny zdarma)
1. **GitHub účet** - pro verzování kódu
2. **Heroku účet** - pro hosting aplikace
3. **MongoDB Atlas účet** - pro databázi (už máte ✅)
4. **Google Cloud účet** - pro Maps API

### Příprava
- Stažený balíček `beauty-marketplace-complete.zip`
- Přístup k internetu
- Webový prohlížeč

## 🗂️ Krok 1: Příprava souborů (5 minut)

### 1.1 Rozbalení balíčku
1. Stáhněte si `beauty-marketplace-complete.zip`
2. Rozbalte do složky `beauty-marketplace`
3. Ověřte strukturu:
   ```
   beauty-marketplace/
   ├── frontend/
   ├── backend/
   ├── docs/
   └── README.md
   ```

### 1.2 Kontrola souborů
Ujistěte se, že máte tyto klíčové soubory:
- `backend/server.js` ✅
- `backend/package.json` ✅
- `backend/Procfile` ✅
- `frontend/package.json` ✅
- `frontend/Procfile` ✅
- `frontend/pages/index.tsx` ✅

## 🐙 Krok 2: Nastavení GitHub repozitáře (5 minut)

### 2.1 Vytvoření repozitáře
1. Jděte na [github.com](https://github.com)
2. Klikněte na "New repository"
3. Název: `beauty-marketplace`
4. Nastavte jako **Public** (pro free Heroku)
5. Klikněte "Create repository"

### 2.2 Nahrání kódu
Máte dvě možnosti:

**Možnost A: Přes webové rozhraní (jednodušší)**
1. V GitHub repozitáři klikněte "uploading an existing file"
2. Přetáhněte všechny soubory z rozbalené složky
3. Commit message: "Initial commit - Beauty Marketplace"
4. Klikněte "Commit changes"

**Možnost B: Přes Git (pokročilejší)**
```bash
cd beauty-marketplace
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VASE_UZIVATELSKE_JMENO/beauty-marketplace.git
git push -u origin main
```


## 🍃 Krok 3: Nastavení MongoDB Atlas (10 minut)

### 3.1 Příprava databáze
1. Jděte na [cloud.mongodb.com](https://cloud.mongodb.com)
2. Přihlaste se do vašeho účtu

### 3.2 Vytvoření clusteru (pokud nemáte)
1. Klikněte "Build a Database"
2. Vyberte **M0 Sandbox** (FREE)
3. Vyberte region (doporučuji nejbližší k ČR)
4. Cluster Name: `beauty-marketplace`
5. Klikněte "Create"

### 3.3 Nastavení přístupu
1. **Database Access**:
   - Klikněte "Database Access" v levém menu
   - "Add New Database User"
   - Username: `beautyapp`
   - Password: Vygenerujte silné heslo (uložte si ho!)
   - Database User Privileges: "Read and write to any database"
   - "Add User"

2. **Network Access**:
   - Klikněte "Network Access" v levém menu
   - "Add IP Address"
   - "Allow Access from Anywhere" (0.0.0.0/0)
   - "Confirm"

### 3.4 Získání connection stringu
1. Jděte na "Database" v levém menu
2. U vašeho clusteru klikněte "Connect"
3. Vyberte "Connect your application"
4. Driver: Node.js, Version: 4.1 or later
5. Zkopírujte connection string
6. **DŮLEŽITÉ**: Nahraďte `<password>` vaším skutečným heslem

**Příklad connection stringu:**
```
mongodb+srv://beautyapp:VASE_HESLO@beauty-marketplace.abc123.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ ULOŽTE SI TENTO STRING - budete ho potřebovat!**


## 🚀 Krok 4: Nasazení Backend na Heroku (10 minut)

### 4.1 Příprava Heroku účtu
1. Jděte na [heroku.com](https://heroku.com)
2. Zaregistrujte se / přihlaste se
3. Ověřte email adresu

### 4.2 Vytvoření backend aplikace
1. Na Heroku dashboardu klikněte "New" → "Create new app"
2. App name: `vase-jmeno-beauty-backend` (musí být unikátní)
3. Region: Europe
4. Klikněte "Create app"

### 4.3 Propojení s GitHub
1. V záložce "Deploy" vyberte "GitHub"
2. Klikněte "Connect to GitHub"
3. Autorizujte Heroku přístup
4. Najděte váš repozitář `beauty-marketplace`
5. Klikněte "Connect"

### 4.4 Nastavení environment variables
1. Jděte na záložku "Settings"
2. Klikněte "Reveal Config Vars"
3. Přidejte tyto proměnné:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Váš MongoDB connection string |
| `JWT_SECRET` | `beauty_marketplace_secret_2024_production` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://vase-jmeno-beauty-frontend.herokuapp.com` |

**⚠️ POZOR**: U `FRONTEND_URL` použijte název, který budete používat pro frontend (krok 5)

### 4.5 Nasazení backend
1. Jděte na záložku "Deploy"
2. V sekci "Manual deploy" vyberte branch `main`
3. Klikněte "Deploy Branch"
4. Počkejte na dokončení (2-3 minuty)
5. Klikněte "View" pro otestování

**✅ Test**: Měli byste vidět JSON odpověď s informacemi o API


## 🎨 Krok 5: Nasazení Frontend na Heroku (10 minut)

### 5.1 Vytvoření frontend aplikace
1. Na Heroku dashboardu klikněte "New" → "Create new app"
2. App name: `vase-jmeno-beauty-frontend` (musí být unikátní)
3. Region: Europe
4. Klikněte "Create app"

### 5.2 Propojení s GitHub
1. V záložce "Deploy" vyberte "GitHub"
2. Najděte váš repozitář `beauty-marketplace`
3. Klikněte "Connect"

### 5.3 Nastavení environment variables
1. Jděte na záložku "Settings"
2. Klikněte "Reveal Config Vars"
3. Přidejte tyto proměnné:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://vase-jmeno-beauty-backend.herokuapp.com/api` |
| `NEXT_PUBLIC_AUTH_COOKIE_NAME` | `beauty_marketplace_auth` |
| `NEXT_PUBLIC_AUTH_TOKEN_EXPIRY` | `7` |

**⚠️ POZOR**: U `NEXT_PUBLIC_API_URL` použijte skutečný název vašeho backend

### 5.4 Nastavení buildpacků
1. V záložce "Settings" najděte "Buildpacks"
2. Klikněte "Add buildpack"
3. Vyberte "nodejs"
4. Klikněte "Save changes"

### 5.5 Nasazení frontend
1. Jděte na záložku "Deploy"
2. V sekci "Manual deploy" vyberte branch `main`
3. Klikněte "Deploy Branch"
4. Počkejte na dokončení (3-5 minut)
5. Klikněte "View" pro otestování

**✅ Test**: Měli byste vidět úvodní stránku Beauty Marketplace

## 🔄 Krok 6: Aktualizace backend konfigurace

### 6.1 Oprava FRONTEND_URL
1. Jděte zpět do backend aplikace na Heroku
2. V "Settings" → "Config Vars"
3. Upravte `FRONTEND_URL` na skutečnou URL vašeho frontend
4. Příklad: `https://vase-jmeno-beauty-frontend.herokuapp.com`

### 6.2 Restart aplikací
1. V backend aplikaci: "More" → "Restart all dynos"
2. V frontend aplikaci: "More" → "Restart all dynos"


## ✅ Krok 7: Finální testování a spuštění testovacích dat

### 7.1 Test aplikace
1. Otevřete frontend URL: `https://vase-jmeno-beauty-frontend.herokuapp.com`
2. Ověřte, že se stránka načte bez chyb
3. Otevřete backend URL: `https://vase-jmeno-beauty-backend.herokuapp.com`
4. Ověřte, že vidíte JSON s API informacemi

### 7.2 Spuštění testovacích dat (volitelné)
Pro naplnění databáze testovacími daty:

1. V backend aplikaci na Heroku jděte na "More" → "Run console"
2. Spusťte: `node scripts/setup-test-data.js`
3. Počkejte na dokončení

### 7.3 Kontrola databáze
1. V MongoDB Atlas jděte na "Database" → "Browse Collections"
2. Měli byste vidět kolekce: users, services, providers, bookings

## 🎉 Gratulujeme! Aplikace je nasazena!

### 📱 Vaše URL adresy:
- **Frontend (pro uživatele)**: `https://vase-jmeno-beauty-frontend.herokuapp.com`
- **Backend (API)**: `https://vase-jmeno-beauty-backend.herokuapp.com`

### 🔗 Sdílení s testery
Sdílejte frontend URL s přáteli a rodinou pro testování!

## 🛠️ Řešení problémů

### Časté problémy:

**1. "Application Error" na Heroku**
- Zkontrolujte logy: V aplikaci → "More" → "View logs"
- Nejčastější příčina: špatný MongoDB connection string

**2. Frontend se nenačte**
- Zkontrolujte, že backend běží
- Ověřte `NEXT_PUBLIC_API_URL` v config vars

**3. Databáze se nepřipojí**
- Ověřte MongoDB connection string
- Zkontrolujte Network Access (0.0.0.0/0)
- Ověřte Database User credentials

**4. "Module not found" chyby**
- Zkontrolujte, že všechny soubory jsou v GitHub repozitáři
- Znovu nasaďte aplikaci

### 📞 Podpora
Pokud narazíte na problémy:
1. Zkontrolujte Heroku logy
2. Ověřte všechny Config Vars
3. Zkuste znovu nasadit aplikaci

## 🚀 Další kroky

### Pro rozšíření funkcionalitě:
1. **Google Maps API** - pro mapové funkce
2. **Stripe API** - pro platby
3. **Email služba** - pro notifikace

### Pro produkční použití:
1. Vlastní doména
2. SSL certifikát
3. Monitoring a zálohy
4. Škálování na vyšší Heroku plány

**🎊 Vaše aplikace je připravena pro testování!**

