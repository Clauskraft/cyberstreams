# GitHub Secrets Update Guide

## Step 1: Go to GitHub Repository Settings
1. Go to: https://github.com/Clauskraft/cyberstreams/settings/secrets/actions
2. Click "New repository secret" for each secret below

## Step 2: Update These Secrets

### RAILWAY_TOKEN
- **Name**: `RAILWAY_TOKEN`
- **Value**: Get from Railway Dashboard → Account Settings → Tokens
- **Description**: Railway authentication token

### RAILWAY_PROJECT_ID
- **Name**: `RAILWAY_PROJECT_ID`
- **Value**: Get from `railway status` command output
- **Description**: Railway project identifier

### RAILWAY_SERVICE_ID
- **Name**: `RAILWAY_SERVICE_ID`
- **Value**: Get from `railway service` command output
- **Description**: Railway service identifier

### RAILWAY_ENVIRONMENT (Optional)
- **Name**: `RAILWAY_ENVIRONMENT`
- **Value**: `production` (or leave empty for default)
- **Description**: Railway environment name

## Step 3: Verify Secrets
After updating all secrets, the GitHub Actions workflow will automatically deploy to the new Railway project.

## Step 4: Test Deployment
1. Push any change to master branch
2. Check GitHub Actions tab for deployment status
3. Verify deployment at Railway domain