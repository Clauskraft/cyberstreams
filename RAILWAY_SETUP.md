# Railway Deployment Setup Guide

## Current Status
✅ **Code is on GitHub**: All commits pushed successfully to master branch
✅ **Railway Project**: `incredible-heart` (found via CLI)
⚠️ **Service Connection**: Needs to be configured

## Quick Setup (5 minutes)

### Option 1: GitHub Integration (Recommended - Automatic Deploys)

1. **Open Railway Dashboard**
   - Go to: https://railway.app/dashboard
   - Find project: `incredible-heart`

2. **Create or Select Service**
   - If no service exists, click "New Service"
   - Name it: `cyberstreams` or `web`

3. **Connect to GitHub**
   - In the service, go to "Settings"
   - Scroll to "Source" section
   - Click "Connect to GitHub"
   - Select repository: `Clauskraft/cyberstreams`
   - Branch: `master`
   - Build method: Dockerfile

4. **Configure Build**
   - Railway will auto-detect the Dockerfile
   - Start command: `node server.js` (from railway.json)
   - Port: 3001

5. **Deploy**
   - Click "Deploy"
   - Railway will build and deploy automatically
   - Every push to `master` will trigger auto-deployment

### Option 2: CLI Deployment (Manual Trigger)

If you prefer CLI control:

1. **Get Service Name**
   ```bash
   cd C:\Users\claus\Projects\Cyberstreams_dk
   railway login
   railway status
   ```
   This will show you the service name.

2. **Add GitHub Secret**
   - Go to: https://github.com/Clauskraft/cyberstreams/settings/secrets/actions
   - Add new secret: `RAILWAY_SERVICE_NAME`
   - Value: (the service name from step 1)

3. **Update Workflow**
   The workflow will then use:
   ```yaml
   railway up --service ${{ secrets.RAILWAY_SERVICE_NAME }} --detach
   ```

## Environment Variables

Set these in Railway Dashboard → Service → Variables:

```bash
NODE_ENV=production
PORT=3001
SQLITE_DB_PATH=data/cyberstreams.db
LOG_LEVEL=info
API_PORT=3001
```

## Verify Deployment

After deployment:

1. **Get URL**
   ```bash
   railway domain
   ```
   Or check Railway dashboard → Service → Settings → Domains

2. **Test Endpoints**
   ```bash
   curl https://your-app.railway.app/ready
   curl https://your-app.railway.app/api/health
   ```

## Troubleshooting

### Build Fails
- Check Dockerfile is in repo root
- Verify all dependencies in package.json
- Check Railway build logs

### App Won't Start
- Check environment variables are set
- Verify PORT is 3001 or Railway's PORT variable
- Check app logs in Railway dashboard

### Database Issues
- SQLite data is in `data/` directory
- Ensure data directory is copied in Dockerfile (✅ already done)
- For persistence, mount a Railway volume

## Next Steps

1. ✅ Set up Railway GitHub integration (Option 1 above)
2. ✅ Verify deployment succeeds
3. ✅ Test application endpoints
4. Configure custom domain (optional)
5. Set up monitoring/alerts (optional)

## Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Project: https://railway.app/project/incredible-heart
