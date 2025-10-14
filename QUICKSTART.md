# 🚀 CYBERSTREAMS - HURTIG START

## ✅ Status: KLAR TIL DEPLOYMENT

**Projektet er bygget og klar!** (155.85 KB, gzipped: 49.89 kB)

---

## 🎯 Sådan Deployer Du (Anbefalet Metode)

### Trin 1: Tilføj Cloudflare Secrets til GitHub

1. **Opret API Token:**
   - Gå til: https://dash.cloudflare.com/profile/api-tokens
   - Klik "Create Token"
   - Template: **"Edit Cloudflare Workers"**
   - Permissions: Cloudflare Pages → **Edit**
   - Account: `23b3799e11009b55048086157faff1a1`
   - **Kopier tokenet!**

2. **Tilføj til GitHub:**
   - Gå til: https://github.com/Clauskraft/cyberstreams/settings/secrets/actions
   - Opret secret: `CLOUDFLARE_API_TOKEN` = [dit token]
   - Opret secret: `CLOUDFLARE_ACCOUNT_ID` = `23b3799e11009b55048086157faff1a1`

### Trin 2: Deploy via GitHub Actions

**Automatisk:**
- Merge denne PR til `main` branch
- GitHub Actions deployer automatisk!

**Manuel trigger:**
1. Gå til: https://github.com/Clauskraft/cyberstreams/actions/workflows/deploy-cloudflare.yml
2. Klik "Run workflow"
3. Vælg `main` branch
4. Klik "Run workflow"

### Trin 3: Verificer

Din app er nu live på: **https://cyberstreams.pages.dev** 🎉

---

## 🛠️ Alternativ: Manuel Upload

Hvis du vil deploye manuelt:

1. **Build lokalt:**
   ```bash
   npm install
   npm run build
   ```

2. **Upload til Cloudflare:**
   - Gå til: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages/new/upload
   - Project name: `cyberstreams`
   - Upload `dist/` mappen
   - Klik "Deploy site"

---

## ✅ Success Checklist

- [ ] Cloudflare secrets tilføjet til GitHub
- [ ] PR merged til main (eller workflow kørt manuelt)
- [ ] `https://cyberstreams.pages.dev` viser din app
- [ ] Dagens Puls vises på homepage
- [ ] Threats og Activity moduler virker

---

## 🆘 Hjælp

**Detaljeret guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
**Deployment status:** https://github.com/Clauskraft/cyberstreams/actions
**Cloudflare Dashboard:** https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages

---

**🎯 ANBEFALING**: Brug GitHub Actions - det er automatisk fremover! 🚀

