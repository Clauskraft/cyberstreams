# Complete Deployment & DNS Configuration Guide

## Status Overview

**Cloudflare Pages Project**: cyberstreams
- Project ID: 31490fb0-30e5-45b2-b5e4-e8a97f2a8cdb
- Current URL: https://cyberstreams.pages.dev
- Latest deployment: 2025-10-12 21:42:41 (v1.1.0)
- Status: Live ✓

**Domains in Cloudflare**:
1. cyberfeeds.io (active, no DNS records)
2. cyberfeeds.live (active, no DNS records)
3. cyberfeeds.org (active, no DNS records)
4. cyberfeeds.dk (pending - nameservers not changed)

**New Version Ready**: v1.2.0 (Consolidated Intelligence)
- File: cyberstreams-deploy-v1.2.0.zip (64 KB)
- Features: See CHANGELOG.md

---

## STEP 1: Upload New Version to Cloudflare Pages

**Why**: API token has READ-only permissions, manual upload required

**Upload File**: `cyberstreams-deploy-v1.2.0.zip`

**Upload URL**:
https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages/view/cyberstreams

**Steps**:
1. Go to upload URL
2. Click "Create deployment" or "+ Create deployment"
3. Select "Upload assets"
4. Choose file: cyberstreams-deploy-v1.2.0.zip
5. Click "Deploy"
6. Wait ~30 seconds
7. Test: https://cyberstreams.pages.dev

**What's New in v1.2.0**:
- Consolidated Intelligence platform
- 18 RSS feed sources (FE-DDIS, CERT-DK, NATO, EU, CISA, etc.)
- AI-powered search
- Advanced visualizations (heatmap, severity charts)
- IOC tracking
- Cross-source correlation

---

## STEP 2: Configure DNS Records

### Option A: Via Cloudflare Dashboard (Recommended)

**Why**: API token lacks EDIT permissions for DNS

For each domain, configure DNS via Cloudflare dashboard:

#### cyberfeeds.io
1. Go to: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/cyberfeeds.io/dns/records
2. Click "Add record"
3. Create root CNAME:
   - Type: CNAME
   - Name: @
   - Target: cyberstreams.pages.dev
   - Proxy status: Proxied (orange cloud)
   - TTL: Auto
4. Click "Save"
5. Repeat for www subdomain:
   - Type: CNAME
   - Name: www
   - Target: cyberstreams.pages.dev
   - Proxy status: Proxied
   - TTL: Auto

#### cyberfeeds.live
1. Go to: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/cyberfeeds.live/dns/records
2. Create same CNAME records as above

#### cyberfeeds.org
1. Go to: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/cyberfeeds.org/dns/records
2. Create same CNAME records as above

#### cyberfeeds.dk (REQUIRES NAMESERVER CHANGE FIRST)

**Current Status**: Pending (nameservers not changed in DanDomain)

**Cloudflare Nameservers to Use**:
- andy.ns.cloudflare.com
- katja.ns.cloudflare.com

**Steps**:
1. Log in to DanDomain: https://www.dandomain.dk
2. Find domain: cyberfeeds.dk
3. Go to DNS/Nameserver settings
4. Change nameservers to:
   - andy.ns.cloudflare.com
   - katja.ns.cloudflare.com
5. Save and wait 24-48 hours for propagation
6. Once active in Cloudflare, configure DNS as above

### Option B: Via DanDomain (If keeping DanDomain DNS)

If you prefer to keep DNS management in DanDomain:

For each domain in DanDomain:
1. Go to DNS settings
2. Create CNAME record:
   - Host/Name: @ (or blank for root domain)
   - Points to: cyberstreams.pages.dev
   - TTL: 3600 or Auto
3. Create www CNAME:
   - Host/Name: www
   - Points to: cyberstreams.pages.dev
   - TTL: 3600 or Auto

**Note**: This approach means DNS stays in DanDomain but content comes from Cloudflare Pages.

---

## STEP 3: Add Custom Domains to Cloudflare Pages

After DNS is configured, connect domains to Pages project:

**URL**: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages/view/cyberstreams

**Steps**:
1. Go to project settings
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. For each domain, add:
   - cyberfeeds.io
   - www.cyberfeeds.io
   - cyberfeeds.live
   - www.cyberfeeds.live
   - cyberfeeds.org
   - www.cyberfeeds.org
   - cyberfeeds.dk (after nameserver change completes)
   - www.cyberfeeds.dk

5. Cloudflare will verify DNS records
6. SSL certificates issued automatically

---

## STEP 4: Verification & Testing

### Test URLs

**Immediate (after upload)**:
- https://cyberstreams.pages.dev

**After DNS propagation (1-24 hours)**:
- https://cyberfeeds.io
- https://www.cyberfeeds.io
- https://cyberfeeds.live
- https://www.cyberfeeds.live
- https://cyberfeeds.org
- https://www.cyberfeeds.org
- https://cyberfeeds.dk (after nameserver change)
- https://www.cyberfeeds.dk

### Check DNS Propagation

```bash
# Check if CNAME records are live
nslookup cyberfeeds.io
nslookup www.cyberfeeds.io

# Should show Cloudflare IPs or cyberstreams.pages.dev
```

### Test Checklist

After deployment completes:

- [ ] https://cyberstreams.pages.dev loads
- [ ] Dashboard tab shows content
- [ ] Threats tab shows threats
- [ ] Activity tab shows activity log
- [ ] Dagens Puls tab shows feed
- [ ] **NEW**: Consolidated Intel tab shows intelligence platform
- [ ] All tabs switch correctly
- [ ] Search functionality works
- [ ] No JavaScript errors in console
- [ ] Mobile responsive design works

---

## DNS Propagation Timeline

- **Immediate**: cyberstreams.pages.dev (always works)
- **5-60 minutes**: CNAME changes start propagating
- **1-4 hours**: Most global DNS servers updated
- **24-48 hours**: Complete global propagation
- **cyberfeeds.dk**: 24-48 hours after nameserver change in DanDomain

---

## Troubleshooting

### "Domain not found" or "DNS_PROBE_FINISHED_NXDOMAIN"
- DNS not yet propagated, wait longer
- Check nameservers are correct in DanDomain
- Verify CNAME records created correctly

### "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"
- Wait for Cloudflare to issue SSL certificate (15-30 minutes)
- Ensure proxy status is ON (orange cloud) in Cloudflare DNS

### Domain shows "This site can't be reached"
- Verify domain added to Cloudflare Pages custom domains
- Check DNS records point to cyberstreams.pages.dev
- Wait for DNS propagation

### Website shows old version
- Clear browser cache (Ctrl+Shift+R)
- Check deployment timestamp in Cloudflare Pages
- Verify v1.2.0 was uploaded successfully

---

## Support & Documentation

- **Cloudflare Dashboard**: https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1
- **DanDomain**: https://www.dandomain.dk
- **GitHub Repo**: https://github.com/Clauskraft/cyberstreams
- **Version**: 1.2.0
- **Changelog**: See CHANGELOG.md
- **Features**: See CONSOLIDATED_INTELLIGENCE.md

---

## Summary

**Action Items**:
1. ✓ New version v1.2.0 created (cyberstreams-deploy-v1.2.0.zip)
2. ☐ Upload to Cloudflare Pages (manual, ~30 sec)
3. ☐ Change nameservers in DanDomain for cyberfeeds.dk (if using Cloudflare DNS)
4. ☐ Configure DNS records for all 4 domains (via Cloudflare or DanDomain)
5. ☐ Add custom domains to Pages project
6. ☐ Test all URLs after propagation

**Estimated Time**:
- Upload: 30 seconds
- DNS configuration: 10 minutes
- Propagation wait: 1-48 hours (depending on domain/changes)
- Total active work: ~15 minutes

**Result**:
All your domains (cyberfeeds.io, .live, .org, .dk) will show the same Cyberstreams v1.2.0 application with the new Consolidated Intelligence platform.
