# 🚀 Cyberstreams - Deployment Guide

**Status:** ✅ **KLAR TIL DEPLOYMENT**

---

## 📋 Hvad skal du gøre?

Du har **2 muligheder** for at deploye Cyberstreams:

### ✨ **Mulighed 1: Automatisk Deployment via GitHub Actions (ANBEFALET)**

Dette er den **nemmeste måde** - GitHub gør alt arbejdet for dig!

#### Trin 1: Opsæt Cloudflare Secrets

1. **Opret Cloudflare API Token:**
   - Gå til: https://dash.cloudflare.com/profile/api-tokens
   - Klik "Create Token"
   - Vælg template: **"Edit Cloudflare Workers"**
   - **ELLER** opret custom token med disse permissions:
     - ✅ Account → Cloudflare Pages → **Edit**
     - ✅ Account → Account Settings → **Read**
   - Sæt Account Resources til: `23b3799e11009b55048086157faff1a1`
   - Klik "Create Token" og **kopier tokenet**

2. **Tilføj Secrets til GitHub:**
   - Gå til: https://github.com/Clauskraft/cyberstreams/settings/secrets/actions
   - Klik "New repository secret"
   - **Secret 1:**
     - Name: `CLOUDFLARE_API_TOKEN`
     - Value: [Det token du lige kopierede]
   - **Secret 2:**
     - Name: `CLOUDFLARE_ACCOUNT_ID`
     - Value: `23b3799e11009b55048086157faff1a1`

#### Trin 2: Deploy!

**Automatisk deployment:**
- Bare merge denne PR til `main` branch
- GitHub Actions deployer automatisk til Cloudflare Pages
- Se status under: https://github.com/Clauskraft/cyberstreams/actions

**Manuel deployment:**
1. Gå til: https://github.com/Clauskraft/cyberstreams/actions/workflows/deploy-cloudflare.yml
2. Klik "Run workflow"
3. Vælg `main` branch
4. Klik "Run workflow"

#### Trin 3: Verificer

Din app er nu live på:
- **Pages URL:** https://cyberstreams.pages.dev
- **Custom Domain:** Konfigurer i Cloudflare Dashboard hvis ønsket

---

### 🛠️ **Mulighed 2: Manuel Upload til Cloudflare Pages**

Hvis du vil deploye manuelt:

#### Trin 1: Byg projektet lokalt

```bash
cd /home/runner/work/cyberstreams/cyberstreams
npm install
npm run build
```

Dette opretter en `dist/` mappe med alle filer.

#### Trin 2: Upload til Cloudflare

1. Gå til: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages/new/upload
2. **Project name:** `cyberstreams`
3. Upload hele `dist/` mappen (eller lav en ZIP først)
4. Klik "Deploy site"

#### Trin 3: Custom Domain (valgfrit)

Efter deployment:
1. Gå til project settings
2. Klik "Custom domains"
3. Add domain: `cyberstreams.dk`

---

## ✅ Success Kriterier

Når deployment er succesfuld, kan du:

- ✅ Tilgå din app på `https://cyberstreams.pages.dev`
- ✅ Se dit site med HTTPS (🔒 i browser)
- ✅ Alle features virker (Dashboard, Threats, Activity, Dagens Puls)

---

## 🔍 Troubleshooting

### "Authentication Error" i GitHub Actions
- Verificer at `CLOUDFLARE_API_TOKEN` er sat korrekt
- Tjek at tokenet har de rigtige permissions
- Opret et nyt token hvis nødvendigt

### "Project not found"
- Verificer at `CLOUDFLARE_ACCOUNT_ID` er korrekt
- Opret Pages projektet manuelt i Cloudflare Dashboard først

### Build fejler
- Kør `npm run build` lokalt for at se fejlen
- Verificer at alle dependencies er installeret

---

## 📊 Projekt Info

- **Account ID:** `23b3799e11009b55048086157faff1a1`
- **Project Name:** `cyberstreams`
- **Build Output:** `dist/` (155.85 KB, gzipped: 49.89 KB)
- **Build Command:** `npm run build` (kører: `tsc && vite build`)
- **Node Version:** 20.x

---

## 🎯 Anbefaling

**Brug Mulighed 1 (GitHub Actions)** - det er:
- ✅ Automatisk ved hver commit til main
- ✅ Ingen manuel arbejde efter setup
- ✅ Versionshistorik og rollback muligheder
- ✅ Deployment logs i GitHub

**Setup tid:** 5-10 minutter første gang, derefter automatisk! 🚀

---

## 📞 Hjælp

Har du problemer?
- Se GitHub Actions logs: https://github.com/Clauskraft/cyberstreams/actions
- Cloudflare Dashboard: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages
- Cloudflare Docs: https://developers.cloudflare.com/pages/

---

**🎉 Held og lykke med deploymentet!**
