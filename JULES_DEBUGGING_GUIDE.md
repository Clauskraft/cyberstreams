# 🚨 KRITISK DEBUGGING GUIDE TIL JULES

## ❌ PROBLEM IDENTIFICERET

**Du arbejder på den forkerte fil!**

- **Du modificerer**: `cyberstreams/server.js` (mock server på port 3001)
- **Du skal modificere**: `server.js` (hovedserveren på port 3000)
- **Playwright tests kører mod**: port 3000 (hovedserveren)

## 🔧 LØSNING

### 1. STOP ARBEJDE PÅ FORKERT FIL
```bash
# STOP med cyberstreams/server.js
# START med server.js
```

### 2. ANVEND BUG FIX PÅ RIGTIG FIL
**Fil**: `server.js` (IKKE cyberstreams/server.js)
**Linje**: 405-415 (getSourceIcon funktionen)

**Din bug fix skal anvendes her:**
```javascript
// I server.js linje 405-415
getSourceIcon(sourceDomain) {
  const iconMap = {
    'cfcs.dk': 'shield',
    'enisa.europa.eu': 'shield-check', 
    'cert.europa.eu': 'shield-alert',
    'cisa.gov': 'flag',
    'nvd.nist.gov': 'database',
    'msrc.microsoft.com': 'building'
  }
  return iconMap[sourceDomain] || 'shield'
}
```

### 3. OPRET TEST FIL KORREKT
**Fil**: `tests/server.test.js` (IKKE i cyberstreams mappen)

```javascript
import { test, expect } from '@playwright/test'

test('DailyPulseGenerator uses sourceDomain for icons', async ({ page }) => {
  const response = await page.request.get('/api/daily-pulse')
  const data = await response.json()
  
  // Verify that sourceIcon is based on domain, not name
  expect(data.data[0].sourceIcon).toBe('shield') // cfcs.dk should give 'shield'
})
```

### 4. KØR TESTS KORREKT
```bash
# Test mod hovedserveren (port 3000)
npm run test:e2e
```

## 📊 AKTUEL STATUS

### ✅ Hvad du har gjort rigtigt:
- Identificeret bug korrekt (source icons bruger name i stedet for domain)
- Skrevet korrekt fix
- Oprettet test struktur

### ❌ Hvad der er galt:
- Arbejder på forkert fil (`cyberstreams/server.js` i stedet for `server.js`)
- Tests kører mod port 3000, men din fix er på port 3001
- Test fil ikke oprettet i korrekt lokation

## 🎯 NÆSTE SKRIDT

1. **STOP** arbejde på `cyberstreams/server.js`
2. **ANVEND** din bug fix på `server.js` linje 405-415
3. **OPRET** `tests/server.test.js` i root tests mappen
4. **KØR** `npm run test:e2e` for at teste mod port 3000

## 🔍 VERIFIKATION

Efter fix:
```bash
# Test at serveren kører på port 3000
curl http://localhost:3000/api/daily-pulse

# Kør Playwright tests
npm run test:e2e
```

## ⚠️ VIKTIGT

**Hovedserveren (`server.js`) er komplet og fungerer korrekt.**
**Mock serveren (`cyberstreams/server.js`) er kun til test formål.**

**Du skal arbejde på hovedserveren for at fixe buggen!**

---
**Status**: Jules arbejder på forkert fil - skal skifte til `server.js`
**Prioritet**: HØJ - Fix skal anvendes på korrekt fil
**Deadline**: ASAP
