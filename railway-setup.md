# Railway CLI Commands for New Project Creation

## Step 1: Login to Railway
```bash
railway login
```

## Step 2: Create New Project
```bash
# Create new project
railway new cyberstreams-v2

# Link to GitHub repository
railway link

# Set build and start commands
railway variables set RAILWAY_BUILD_COMMAND="npm run build"
railway variables set RAILWAY_START_COMMAND="npm start"
```

## Step 3: Get Project Credentials
```bash
# Get project ID
railway status

# Get service ID
railway service

# Get Railway token (from dashboard)
# Go to: https://railway.app/dashboard -> Account Settings -> Tokens
```

## Step 4: Update GitHub Secrets
Go to: https://github.com/Clauskraft/cyberstreams/settings/secrets/actions

Update these secrets:
- `RAILWAY_TOKEN` (new token from dashboard)
- `RAILWAY_PROJECT_ID` (from railway status)
- `RAILWAY_SERVICE_ID` (from railway service)

## Step 5: Test Deployment
```bash
# Push to trigger deployment
git add .
git commit -m "Test Railway v2.0.0 deployment"
git push origin master
```

## Step 6: Verify Deployment
```bash
# Get deployment URL
railway domain

# Test endpoints
curl https://your-new-domain.railway.app/ready
curl https://your-new-domain.railway.app/api/health
```