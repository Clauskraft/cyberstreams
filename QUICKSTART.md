# 🚀 CYBERSTREAMS - 2-MINUTE QUICKSTART

## Option 1: Manual Upload (NEMMEST - 60 sekunder)

### Step 1: Opret projekt i Cloudflare
1. Åbn: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages/new/upload
2. **Project name**: `cyberstreams`
3. **Upload**: `C:\Users\claus\Projects\Cyberstreams_dk\cyberstreams-deploy.zip`
4. Klik **"Deploy site"**

✅ **Din app er nu live på**: `https://cyberstreams.pages.dev`

### Step 2: Add custom domain (30 sekunder)
1. Gå til project settings
2. Klik **"Custom domains"**
3. Add: `cyberstreams.dk`
4. Add: `www.cyberstreams.dk`

✅ **FÆRDIG!** App er live på `https://cyberstreams.dk`

---

## Option 2: Fix API Token (hvis du vil automatisere)

### Token Permissions (VIGTIGT!)

Gå til: https://dash.cloudflare.com/profile/api-tokens

Find dit token og sæt disse permissions:

```
✅ Account → Cloudflare Pages → EDIT (IKKE Read!)
✅ Zone → DNS → Edit
✅ Account → Account Settings → Read
```

**Account Resources**: Include → Specific account → [Din account]
**Zone Resources**: Include → Specific zone → cyberstreams.dk

### Kør Deployment

```bash
python deploy-cloudflare.py
```

---

## ✅ Success Checklist

- [ ] ZIP fil uploaded til Cloudflare
- [ ] Pages projekt oprettet
- [ ] `https://cyberstreams.pages.dev` virker
- [ ] Custom domains tilføjet
- [ ] `https://cyberstreams.dk` virker (kan tage 5-10 min)
- [ ] SSL aktiveret (🔒 i browser)

---

## 🆘 Hvis noget går galt

**API Token fejl?**
→ Tjek at permission er "Edit" ikke "Read"

**Custom domain virker ikke?**
→ Vent 5-10 minutter på DNS propagation
→ Test `https://cyberstreams.pages.dev` i mellemtiden

**ZIP upload fejler?**
→ Prøv at uploade `dist/` mappen direkte i stedet

---

**🎯 ANBEFALING**: Bare brug Option 1 - det er hurtigst og virker 100%!
