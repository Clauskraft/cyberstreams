# Railway Deployment Guide - Cyberstreams

**Last Updated**: 2025-10-18
**Status**: ✅ Ready for Deployment
**Platform**: Railway (railway.app)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Environment Variables](#environment-variables)
4. [Deployment Process](#deployment-process)
5. [Monitoring & Management](#monitoring--management)
6. [Troubleshooting](#troubleshooting)
7. [Custom Domain Setup](#custom-domain-setup)

---

## Prerequisites

### Local Requirements
- Node.js 18+ installed
- npm or yarn
- Railway CLI installed: `npm install -g @railway/cli`
- Git repository initialized

### Railway Account
- Create account at [railway.app](https://railway.app)
- Obtain Railway API token
- Have a GitHub repository linked (recommended)

---

## Setup Instructions

### 1. Initialize Railway Project Locally

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your Railway account (opens browser)
# Follow the authentication flow

# Initialize Railway in your project
railway init
```

### 2. Verify Configuration Files

The project includes:
- ✅ `railway.json` - Railway configuration
- ✅ `Dockerfile` - Multi-stage build for frontend + backend
- ✅ `.railwayignore` - Files to ignore during deployment
- ✅ `package.json` - Scripts configured for Railway

### 3. Test Locally with Railway CLI

```bash
# Preview your Railway environment locally
railway up

# This will:
# 1. Build your Docker image
# 2. Run the container locally
# 3. Show logs in real-time

# Press Ctrl+C to stop
```

---

## Environment Variables

### Production Variables (Set in Railway Dashboard)

Railway will automatically detect and set:

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | 3000 | ✅ | Server port (Railway sets this) |
| `NODE_ENV` | production | ✅ | Environment mode |

### Optional Variables (Add as needed)

```bash
# API Configuration
API_BASE_URL=https://your-api-domain.com
API_TIMEOUT=30000

# Logging
LOG_LEVEL=info
DEBUG=false

# Database (if using)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your-secret-key
```

### How to Set Variables in Railway

1. Open Railway Dashboard
2. Go to your project
3. Select the service
4. Click "Variables"
5. Add key-value pairs
6. Click "Deploy" to apply changes

---

## Deployment Process

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure Railway deployment"
   git push origin main
   ```

2. **Connect Railway to GitHub**
   - Go to [railway.app/dashboard](https://railway.app/dashboard)
   - Click "Create New Project"
   - Select "Deploy from GitHub"
   - Select your repository
   - Choose branch to deploy (usually `main` or `master`)

3. **Configure Service**
   - Railway auto-detects `Dockerfile`
   - Sets build command
   - Deploys automatically on push

4. **Automatic Deployments**
   - Every push to main branch = auto-deploy
   - Deployments typically take 2-5 minutes
   - View logs in real-time

### Method 2: Railway CLI (Manual)

1. **Link to Railway Service**
   ```bash
   railway link
   # Select project from list
   # Or create new project
   ```

2. **Deploy**
   ```bash
   railway up --detach
   ```

3. **View Logs**
   ```bash
   railway logs
   ```

4. **Open in Browser**
   ```bash
   railway open
   ```

### Method 3: Railway Dashboard (Web UI)

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Create New Project → Deploy from GitHub
3. Select your repo
4. Wait for automatic deployment
5. Access via Railway-provided URL

---

## Deployment Checklist

Before deploying:

- [ ] All code committed to Git
- [ ] `npm run build` works locally
- [ ] No console errors in production build
- [ ] `.railwayignore` configured correctly
- [ ] Environment variables documented
- [ ] Database migrations (if applicable) prepared
- [ ] All secrets added to Railway (not in code)

---

## Monitoring & Management

### View Project Status

```bash
# List all projects
railway projects

# Select current project
railway projects:select

# View project info
railway info
```

### View Logs

```bash
# Real-time logs
railway logs

# Last 100 lines
railway logs -n 100

# Follow logs
railway logs -f
```

### Monitor Performance

In Railway Dashboard:

1. **Deployments Tab**
   - View deployment history
   - See deployment status
   - View build logs

2. **Logs Tab**
   - Real-time application logs
   - Search logs by keyword
   - Filter by log level

3. **Metrics Tab** (Premium)
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

### Health Check

The application includes a health check endpoint:

```bash
curl https://your-railway-url.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "operational",
  "timestamp": "2025-10-18T14:22:00.000Z",
  "version": "1.0.0"
}
```

---

## Troubleshooting

### Issue: Build Failed

**Symptoms**: Deployment fails during build phase

**Solutions**:
1. Check `railway logs` for error messages
2. Verify `npm run build` works locally
3. Check Dockerfile syntax
4. Ensure all dependencies listed in package.json

```bash
# Test locally
npm install
npm run build
```

### Issue: Port Binding Error

**Symptoms**: Application crashes with port error

**Solution**: PORT is already set by Railway. Verify server.js uses:
```javascript
const PORT = process.env.PORT || 3000
```

### Issue: 502 Bad Gateway

**Symptoms**: Getting 502 error after deployment

**Solutions**:
1. Check health endpoint: `/api/health`
2. View logs: `railway logs`
3. Verify PORT is correctly used
4. Check for startup errors

```bash
# View recent logs
railway logs -n 50
```

### Issue: Environment Variables Not Working

**Solution**:
1. Verify variables set in Railway Dashboard
2. Restart service after adding variables
3. Use consistent variable names in code

```bash
# Check variables
echo $API_KEY
echo $DATABASE_URL
```

### Issue: Out of Memory

**Solutions**:
1. Upgrade Railway plan (for more RAM)
2. Check for memory leaks in code
3. Use Node.js memory flags:

```javascript
// Add to top of server.js if needed
if (process.env.NODE_OPTIONS) {
  // Already set by environment
}
```

---

## Custom Domain Setup

### Connect Custom Domain

1. **In Railway Dashboard**
   - Go to your project
   - Select service
   - Click "Settings"
   - Under "Domains", add custom domain

2. **Update DNS Records**

   Railway will provide CNAME:
   - Type: CNAME
   - Name: your domain
   - Value: railway-provided.railway.app
   - TTL: 3600

3. **Verify SSL Certificate**
   - Railway auto-provisions Let's Encrypt certificate
   - Wait 5-10 minutes for certificate generation
   - Test: `https://your-domain.com`

### Environment Variable for Domain

Add to Railway environment variables:
```
API_BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```

---

## Deployment Architecture

### Build Process

```
┌─────────────────────────────────────┐
│ Git Repository (GitHub)             │
│ ├─ src/ (React components)          │
│ ├─ server.js (Express backend)      │
│ └─ Dockerfile (multi-stage)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Railway Pipeline                    │
│ 1. Clone repository                 │
│ 2. Build Docker image               │
│ 3. Run tests (optional)             │
│ 4. Push to registry                 │
│ 5. Deploy container                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Running Service                     │
│ ├─ Frontend: dist/ (static)         │
│ ├─ Backend: Express server          │
│ └─ API Endpoints: /api/*            │
└─────────────────────────────────────┘
```

### Multi-Stage Docker Build

1. **Stage 1: Builder**
   - Node 18 Alpine
   - Install dependencies
   - Build frontend with Vite (→ dist/)

2. **Stage 2: Runtime**
   - Node 18 Alpine (smaller)
   - Copy dist/ from builder
   - Run Express server
   - Serve static files

**Benefits**:
- Smaller final image
- No build tools in production
- Faster deployment
- Better security

---

## Performance Tips

### Optimize Build Time
- Use `npm ci` instead of `npm install`
- Cache dependencies in Docker
- Minimize node_modules size

### Optimize Runtime
- Enable gzip compression
- Use lazy loading for components
- Implement caching headers
- Monitor bundle size

### Database Optimization (if applicable)
- Use connection pooling
- Index frequently queried columns
- Archive old data
- Use read replicas for scaling

---

## Backup & Recovery

### Backup Database (if using)

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Redeploy Previous Version

1. View deployment history in Dashboard
2. Select previous deployment
3. Click "Redeploy"
4. Railway rolls back immediately

---

## Scaling & Upgrades

### Horizontal Scaling (Multiple Instances)

Railway plans support scaling. Upgrade plan to:
- 1GB RAM → 2GB+ RAM
- Add auto-scaling rules
- Load balance across instances

### Vertical Scaling

1. Go to Project Settings
2. Select service
3. Upgrade plan tier
4. Changes apply on next deployment

---

## Security Best Practices

1. **Never commit secrets**
   ```bash
   # Use .env files locally, never commit
   echo ".env" >> .gitignore
   git rm --cached .env
   ```

2. **Use Railway for secrets**
   - Store all secrets in Railway Variables
   - Use long, random values
   - Rotate regularly

3. **Enable HTTPS**
   - Railway auto-provides SSL
   - All traffic encrypted by default
   - Use custom domain for branding

4. **Monitor access**
   - Review logs regularly
   - Set up alerts (Premium)
   - Audit API access

---

## Cost Estimation

### Railway Pricing (as of 2025)

- **Free Tier**: $5 credit/month (limited)
- **Pay-as-you-go**: $0.000927/hour per GB RAM
- **Standard**: ~$7-15/month for small app
- **Professional**: ~$25-50/month for larger apps

### Cost Optimization

1. Use smaller Docker images
2. Optimize code for memory usage
3. Use auto-sleep for dev environments
4. Monitor for runaway processes

---

## Useful Commands

### Railway CLI Commands

```bash
# Authentication
railway login                    # Login to Railway
railway logout                   # Logout
railway whoami                   # Show current user

# Project Management
railway init                     # Initialize project
railway link                     # Link to existing project
railway projects                 # List projects
railway projects:select          # Select project

# Deployment
railway up                       # Deploy locally and to Railway
railway up --detach             # Deploy without waiting
railway down                     # Stop service

# Information
railway info                     # Show project info
railway logs                     # View logs
railway logs -n 100             # Last 100 lines
railway logs -f                 # Follow logs
railway status                   # Show status

# Environment
railway variables               # List variables
railway variables:set KEY VALUE # Set variable
railway variables:unset KEY     # Remove variable

# Utilities
railway open                     # Open dashboard
railway documentation            # Open Railway docs
```

---

## Next Steps

1. **Prepare Repository**
   ```bash
   git add railway.json Dockerfile .railwayignore
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to railway.app
   - Connect GitHub repository
   - Select branch for deployment
   - Watch automatic deployment

3. **Configure Domain** (Optional)
   - Add custom domain in Railway Dashboard
   - Update DNS CNAME record
   - Test: `https://your-domain.com`

4. **Monitor**
   - Check logs regularly
   - Set up alerts
   - Monitor performance metrics

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Status**: https://status.railway.app
- **Community**: https://discord.gg/railway
- **GitHub Issues**: Report problems directly

---

## Checklist for First Deployment

- [ ] Railway account created
- [ ] GitHub repository linked
- [ ] `railway.json` configured
- [ ] `Dockerfile` created
- [ ] `.railwayignore` added
- [ ] `package.json` scripts updated
- [ ] Environment variables documented
- [ ] Tested locally with `railway up`
- [ ] Pushed to GitHub
- [ ] Deployed via Railway Dashboard
- [ ] Health check endpoint responding
- [ ] Logs visible in Railway Dashboard
- [ ] Domain configured (if custom domain needed)

---

**Railway Deployment Ready** ✅

Your Cyberstreams application is configured and ready to deploy on Railway!

