# Railway Deployment - Quick Start Guide

🚀 **Get your Cyberstreams app live on Railway in 5 minutes**

> ### ✅ New: Automatic GitHub deployment
> Pushes to `master`/`main` now trigger `.github/workflows/railway-deploy.yml`.
> Add a `RAILWAY_TOKEN` secret (and optional `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT`) in your repository settings so the workflow can deploy without manual steps.


---

## Step 1: Push to GitHub

```bash
cd C:\Users\claus\Projects\Cyberstreams_dk

git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

---

## Step 2: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Create Account"
3. Sign up with GitHub (recommended)
4. Authorize Railway to access your GitHub

---

## Step 3: Create New Project

1. Click "Create New Project"
2. Select "Deploy from GitHub"
3. Select your `Cyberstreams_dk` repository
4. Select branch: `main` or `master`
5. Click "Deploy"

Railway will automatically:
- Detect Dockerfile
- Build your Docker image
- Deploy your application
- Assign you a Railway domain

⏱️ **Deployment time: 2-5 minutes**

---

## Step 4: Get Your URL

Once deployed, Railway will show:
```
Your application is live at:
https://cyberstreams-production.up.railway.app
```

Visit this URL to see your app running! ✅

---

## Step 5: Test the API

```bash
# Health check
curl https://your-railway-url.up.railway.app/api/health

# Get pulse data
curl https://your-railway-url.up.railway.app/api/pulse

# Get stats
curl https://your-railway-url.up.railway.app/api/stats
```

---

## Optional: Add Custom Domain

1. Go to Railway Dashboard
2. Select your project
3. Click service → Settings
4. Under "Domains" → Add custom domain
5. Update your DNS records:
   - Type: CNAME
   - Value: railway-provided-url
6. Wait 5-10 minutes for SSL certificate

---

## Monitor Your Deployment

### View Logs
```bash
npm install -g @railway/cli
railway login
railway logs
```

### In Railway Dashboard
- Click your project
- Click "Logs" tab
- See real-time application logs

---

## Redeploy After Code Changes

Simply push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway automatically redeploys! ✅

---

## Troubleshooting

### Deployment Failed?
- Check build logs in Railway Dashboard
- Verify `npm run build` works locally
- Check Dockerfile syntax

### App Not Responding?
- Check logs: Railway Dashboard → Logs
- Verify health endpoint: `/api/health`
- Restart service in Railway Dashboard

### Need Help?
- Full guide: `claudedocs/RAILWAY_DEPLOYMENT_GUIDE.md`
- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

---

## Files Created

✅ `railway.json` - Railway configuration
✅ `Dockerfile` - Docker build instructions
✅ `.railwayignore` - Files to ignore
✅ `package.json` - Updated with start scripts

---

**Your app is ready! 🎉**

Go to [railway.app/dashboard](https://railway.app/dashboard) and deploy now!

