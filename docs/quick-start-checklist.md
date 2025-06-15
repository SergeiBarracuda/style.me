# Rychlý start checklist

## ✅ Před začátkem
- [ ] Stažený balíček `beauty-marketplace-complete.zip`
- [ ] GitHub účet
- [ ] Heroku účet  
- [ ] MongoDB Atlas účet (máte ✅)

## 📋 Kroky nasazení

### 1. Příprava (5 min)
- [ ] Rozbalit balíček
- [ ] Zkontrolovat strukturu souborů

### 2. GitHub (5 min)
- [ ] Vytvořit repozitář `beauty-marketplace`
- [ ] Nahrát všechny soubory
- [ ] Commit změn

### 3. MongoDB Atlas (10 min)
- [ ] Vytvořit cluster (pokud nemáte)
- [ ] Nastavit Database User
- [ ] Nastavit Network Access (0.0.0.0/0)
- [ ] Zkopírovat connection string
- [ ] **ULOŽIT connection string!**

### 4. Backend Heroku (10 min)
- [ ] Vytvořit app: `vase-jmeno-beauty-backend`
- [ ] Propojit s GitHub
- [ ] Nastavit Config Vars:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV`
  - [ ] `FRONTEND_URL`
- [ ] Nasadit aplikaci
- [ ] Otestovat (měl by vrátit JSON)

### 5. Frontend Heroku (10 min)
- [ ] Vytvořit app: `vase-jmeno-beauty-frontend`
- [ ] Propojit s GitHub
- [ ] Nastavit Config Vars:
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_AUTH_COOKIE_NAME`
- [ ] Přidat nodejs buildpack
- [ ] Nasadit aplikaci
- [ ] Otestovat (měl by zobrazit stránku)

### 6. Finalizace (5 min)
- [ ] Aktualizovat `FRONTEND_URL` v backend
- [ ] Restart obou aplikací
- [ ] Finální test obou URL

## 🎯 Výsledek
- **Frontend**: `https://vase-jmeno-beauty-frontend.herokuapp.com`
- **Backend**: `https://vase-jmeno-beauty-backend.herokuapp.com`

## 🆘 Pomoc
Pokud něco nefunguje:
1. Zkontrolujte Heroku logy
2. Ověřte Config Vars
3. Zkuste znovu nasadit

**Celkový čas: 30-45 minut**

