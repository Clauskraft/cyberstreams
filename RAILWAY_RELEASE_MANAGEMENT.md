# Railway Release Management System

This document describes the Railway release management and monitoring system for the Cyberstreams platform.

## Overview

As the release manager, this system helps you:
- **Monitor deployments** - Track when releases are triggered and their status
- **Health monitoring** - Continuous health checks of the Railway service
- **Automated alerts** - Team notifications when issues occur
- **Deployment history** - Track and analyze deployment patterns
- **Issue tracking** - Automatically create and close issues for deployment problems

## Components

### 1. GitHub Workflows

#### `railway-deploy.yml`
The main deployment workflow that:
- Triggers on pushes to `main` or `master` branches
- Can be manually triggered via `workflow_dispatch`
- Builds the application with TypeScript and Vite
- Deploys to Railway using the Railway CLI
- Runs post-deployment health checks
- Records deployment status

#### `railway-monitor.yml`
The monitoring workflow that:
- Runs after each deployment completes
- Performs health checks every 15 minutes
- Creates GitHub issues when problems are detected
- Automatically closes issues when problems resolve
- Maintains deployment history

### 2. Health Endpoint

Enhanced `/api/health` endpoint provides:
```json
{
  "status": "operational",
  "timestamp": "2025-10-20T06:36:57.700Z",
  "version": "1.4.0",
  "environment": "production",
  "services": {
    "server": "operational",
    "misp": "configured",
    "openCti": "configured",
    "vectorStore": "available",
    "intelScraper": "available",
    "database": "connected"
  },
  "uptime": 3600,
  "memory": {
    "used": 128,
    "total": 256,
    "rss": 180
  }
}
```

### 3. Railway Manager Script

Command-line tool for release management:

```bash
# Check if service is healthy
npm run railway:health

# Check deployment and record status
npm run railway:check

# Generate deployment report
npm run railway:report
```

## Setup Instructions

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

1. **RAILWAY_TOKEN** - Your Railway API token
   - Get from: https://railway.app/account/tokens
   
2. **RAILWAY_PROJECT_ID** - Your Railway project ID
   - Found in Railway project settings
   
3. **RAILWAY_SERVICE_ID** - Your Railway service ID
   - Found in Railway service settings
   
4. **RAILWAY_APP_URL** - Your deployed app URL
   - Example: `https://your-app.railway.app`
   
5. **RAILWAY_ENVIRONMENT** (Optional) - Target environment
   - Example: `production`

### Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret listed above

## Monitoring and Alerts

### Automated Issue Creation

The system automatically creates GitHub issues for:

1. **Deployment Failures**
   - Title: "🚨 Railway Deployment Failed"
   - Includes: deployment logs, commit info, action required checklist
   
2. **Health Check Failures**
   - Title: "⚠️ Railway Health Check Failed"
   - Includes: service status, troubleshooting steps
   
3. **Service Downtime**
   - Title: "🚨 Railway Service Down - Health Check Failed"
   - Includes: detection time, immediate actions, recovery steps

### Issue Labels

Issues are tagged with:
- `railway-deployment` - Deployment related issues
- `railway-health` - Health check related issues
- `monitoring` - Automated monitoring system
- `urgent` / `critical` - Severity indicators
- `incident` - Active incidents

### Automatic Issue Resolution

When services recover:
- Open issues are automatically closed
- Recovery comments are added with timestamps
- Issue history provides incident timeline

## Health Check Schedule

The monitoring system runs:
- **After each deployment** - Validates successful deployment
- **Every 15 minutes** - Scheduled health checks via cron
- **On-demand** - Manual workflow dispatch available

## Deployment History

The system maintains a history of deployments in `.railway-deployments.json`:

```json
{
  "deployments": [
    {
      "timestamp": "2025-10-20T06:36:57.700Z",
      "status": "success",
      "commit": "abc1234",
      "branch": "main",
      "actor": "username",
      "healthCheck": {
        "success": true,
        "statusCode": 200,
        "data": { ... }
      },
      "url": "https://your-app.railway.app"
    }
  ]
}
```

## Usage Guide

### For Release Managers

1. **Monitor Active Deployments**
   - Watch GitHub Actions for deployment status
   - Check for automated issue creation
   - Review Railway dashboard for real-time logs

2. **Respond to Alerts**
   - When issues are created, they include action checklists
   - Follow the troubleshooting steps provided
   - Update issues with progress and findings

3. **Review Deployment History**
   - Run `npm run railway:report` locally
   - Review success rates and patterns
   - Identify recurring issues

4. **Manual Health Checks**
   - Run `npm run railway:health` to check service status
   - Use Railway dashboard for detailed logs
   - Check `/api/health` endpoint directly

### For Developers

1. **Before Pushing to Main**
   - Ensure all tests pass locally
   - Run `npm run build` to verify build succeeds
   - Review changes for breaking changes

2. **After Deployment**
   - Monitor the GitHub Actions workflow
   - Wait for automated health checks to complete
   - Check for any created issues

3. **Troubleshooting Failures**
   - Review deployment logs in GitHub Actions
   - Check Railway service logs
   - Verify environment variables are set correctly
   - Ensure database is accessible

## Common Issues and Solutions

### Deployment Fails

**Symptoms:** Deployment workflow fails
**Actions:**
1. Check Railway service logs
2. Verify all secrets are configured
3. Check for build errors in logs
4. Ensure Railway has sufficient resources

### Health Check Fails

**Symptoms:** Deployment succeeds but health checks fail
**Actions:**
1. Check server startup in Railway logs
2. Verify database connectivity
3. Check for runtime errors
4. Ensure PORT environment variable is set

### Service Unreachable

**Symptoms:** Scheduled health checks fail
**Actions:**
1. Check Railway service status
2. Verify DNS/domain configuration
3. Check for Railway platform issues
4. Review recent deployments for breaking changes

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review deployment success rates
   - Check for recurring issues
   - Update documentation if needed

2. **Monthly:**
   - Review and clean up old deployment history
   - Audit closed issues for patterns
   - Update monitoring thresholds if needed

3. **Quarterly:**
   - Review and update alert configurations
   - Test manual intervention procedures
   - Update runbooks based on incidents

### Updating the System

To modify monitoring:

1. **Adjust Health Check Frequency**
   - Edit `railway-monitor.yml`
   - Modify the cron schedule
   - Balance between responsiveness and cost

2. **Customize Alerts**
   - Edit issue templates in `railway-monitor.yml`
   - Add or remove checklist items
   - Adjust severity levels

3. **Enhance Health Endpoint**
   - Modify `server.js` health check
   - Add new service checks
   - Include additional metrics

## Best Practices

1. **Always monitor deployments** - Don't assume success
2. **Respond to issues quickly** - Automated issues need human attention
3. **Document incidents** - Add learnings to issue comments
4. **Keep history** - Deployment history helps identify patterns
5. **Test locally first** - Validate changes before pushing
6. **Use staging** - Test in non-production environment when possible

## Support

For issues with the release management system:
1. Check this documentation first
2. Review recent issues for similar problems
3. Check Railway documentation: https://docs.railway.app
4. Contact the development team

## Version History

- **v1.0** - Initial release management system
  - Basic deployment monitoring
  - Health check endpoint
  - Automated issue creation
  - Deployment history tracking
