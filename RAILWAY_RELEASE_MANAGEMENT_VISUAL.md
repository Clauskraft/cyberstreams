# Railway Release Management - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RAILWAY RELEASE MANAGEMENT                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌──────────────────┐       ┌───────────────┐
│   Developer     │       │  GitHub Actions  │       │    Railway    │
│   Pushes Code   │──────▶│   Deployment     │──────▶│   Platform    │
└─────────────────┘       └──────────────────┘       └───────────────┘
                                   │                          │
                                   │                          │
                                   ▼                          ▼
                          ┌──────────────────┐       ┌───────────────┐
                          │ Post-Deployment  │       │  Application  │
                          │  Health Check    │──────▶│   Running     │
                          └──────────────────┘       └───────────────┘
                                   │                          │
                                   │                          │
                                   ▼                          ▼
                          ┌──────────────────┐       ┌───────────────┐
                          │ Record Deployment│       │  /api/health  │
                          │     Status       │       │   Endpoint    │
                          └──────────────────┘       └───────────────┘
                                                             │
                                                             │
┌─────────────────────────────────────────────────────────────────────┐
│                       CONTINUOUS MONITORING                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────┐
│  Every 15 min    │       │  Health Check    │       │   Service    │
│  Cron Schedule   │──────▶│    Workflow      │──────▶│   Status     │
└──────────────────┘       └──────────────────┘       └──────────────┘
                                   │
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
                    ▼                              ▼
           ┌─────────────────┐          ┌─────────────────┐
           │   Service OK    │          │ Service Failed  │
           │  Close Issues   │          │  Create Issue   │
           └─────────────────┘          └─────────────────┘
```

## Workflow States

```
╔═══════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT WORKFLOW                         ║
╚═══════════════════════════════════════════════════════════════╝

Push to main/master
        │
        ▼
  ┌───────────┐
  │   Build   │
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │  Deploy   │─────────┐
  └─────┬─────┘         │ FAILURE
        │               │
        │ SUCCESS       ▼
        ▼         ┌──────────────┐
  ┌───────────┐   │ Create Issue │
  │   Wait    │   │  🚨 Failed   │
  │ 30 sec    │   │  Deployment  │
  └─────┬─────┘   └──────────────┘
        │
        ▼
  ┌───────────┐
  │  Health   │─────────┐
  │   Check   │         │ UNHEALTHY
  └─────┬─────┘         │
        │               ▼
        │         ┌──────────────┐
        │         │ Create Issue │
        │         │ ⚠️  Health   │
        │         │Check Failed  │
        │         └──────────────┘
        │ HEALTHY
        ▼
  ┌───────────┐
  │  Record   │
  │  Success  │
  └───────────┘
```

## Health Monitoring States

```
╔═══════════════════════════════════════════════════════════════╗
║                   HEALTH MONITORING CYCLE                      ║
╚═══════════════════════════════════════════════════════════════╝

         ┌──────────────────────┐
         │  Every 15 minutes    │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Check /api/health   │
         └──────────┬───────────┘
                    │
      ┌─────────────┴─────────────┐
      │                           │
      ▼                           ▼
┌──────────┐                ┌──────────┐
│ HTTP 200 │                │ HTTP 503 │
│ Healthy  │                │ or Error │
└────┬─────┘                └────┬─────┘
     │                           │
     ▼                           ▼
┌──────────┐                ┌──────────┐
│  Close   │                │  Create  │
│Existing  │                │  Issue   │
│ Issues   │                │          │
└──────────┘                └──────────┘
     │                           │
     └─────────────┬─────────────┘
                   │
                   ▼
         ┌──────────────────────┐
         │   Wait 15 minutes    │
         └──────────────────────┘
```

## Issue Lifecycle

```
╔═══════════════════════════════════════════════════════════════╗
║                      ISSUE MANAGEMENT                          ║
╚═══════════════════════════════════════════════════════════════╝

Issue Types:
┌──────────────────────────────────────────────────────────────┐
│ 1. 🚨 Railway Deployment Failed                              │
│    • Created when: Deployment workflow fails                 │
│    • Labels: railway-deployment, monitoring, urgent          │
│    • Closed when: Successful deployment completes            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 2. ⚠️ Railway Health Check Failed                            │
│    • Created when: Post-deployment health check fails        │
│    • Labels: railway-deployment, monitoring, urgent          │
│    • Closed when: Health checks pass                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 3. 🚨 Railway Service Down                                   │
│    • Created when: Scheduled health check fails              │
│    • Labels: railway-health, monitoring, critical, incident  │
│    • Closed when: Service becomes healthy                    │
└──────────────────────────────────────────────────────────────┘

Issue Lifecycle:
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Problem │─────▶│  Create │─────▶│  Team   │─────▶│ Service │
│Detected │      │  Issue  │      │  Fixes  │      │ Healthy │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
                                                          │
                                                          ▼
                                                    ┌─────────┐
                                                    │  Close  │
                                                    │  Issue  │
                                                    └─────────┘
```

## CLI Tools

```
╔═══════════════════════════════════════════════════════════════╗
║                    RAILWAY MANAGER CLI                         ║
╚═══════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────┐
│  npm run railway:health                                        │
│  ├─ Check /api/health endpoint                                │
│  ├─ Retry up to 5 times                                       │
│  ├─ Display service status                                    │
│  └─ Exit code: 0 (healthy) or 1 (unhealthy)                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  npm run railway:check                                         │
│  ├─ Run health check                                          │
│  ├─ Record deployment status                                  │
│  ├─ Save to .railway-deployments.json                         │
│  └─ Display deployment info                                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  npm run railway:report                                        │
│  ├─ Load deployment history                                   │
│  ├─ Calculate success rate                                    │
│  ├─ Display last 10 deployments                               │
│  └─ Show statistics                                           │
└────────────────────────────────────────────────────────────────┘
```

## Health Endpoint Response

```json
{
  "status": "operational",           // operational | degraded
  "timestamp": "2025-10-20T...",
  "version": "1.4.0",
  "environment": "production",
  "services": {
    "server": "operational",
    "misp": "configured",           // configured | not_configured
    "openCti": "configured",
    "vectorStore": "available",     // available | not_available
    "intelScraper": "available",
    "database": "connected"         // connected | disconnected
  },
  "uptime": 3600,                    // seconds
  "memory": {
    "used": 128,                     // MB
    "total": 256,                    // MB
    "rss": 180                       // MB
  }
}
```

## Deployment History Format

```json
{
  "deployments": [
    {
      "timestamp": "2025-10-20T06:36:57.700Z",
      "status": "success",           // success | failure
      "commit": "abc1234",
      "branch": "main",
      "actor": "username",
      "healthCheck": {
        "success": true,
        "statusCode": 200,
        "data": { /* health endpoint response */ }
      },
      "url": "https://your-app.railway.app"
    }
  ]
}
```

## Notification Flow

```
╔═══════════════════════════════════════════════════════════════╗
║                    NOTIFICATION SYSTEM                         ║
╚═══════════════════════════════════════════════════════════════╝

Problem Detected
      │
      ▼
Check for Existing Issues
      │
      ├─ Similar Issue Found ─────▶ Add Comment with Update
      │                                      │
      └─ No Issue Found ──────────▶ Create New Issue
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Issue Created │
                                    │  with Labels  │
                                    └───────┬───────┘
                                            │
                                            ▼
                                    Team Receives Notification
                                            │
                                            ▼
                                    Team Investigates & Fixes
                                            │
                                            ▼
                                    Service Recovers
                                            │
                                            ▼
                                    Monitoring Detects Recovery
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Close Issue   │
                                    │ Add Comment   │
                                    └───────────────┘
```

## Required Secrets Configuration

```
GitHub Repository Settings → Secrets and Variables → Actions

┌─────────────────────────────────────────────────────────────────┐
│ RAILWAY_TOKEN         │ Railway API token from account          │
├─────────────────────────────────────────────────────────────────┤
│ RAILWAY_PROJECT_ID    │ Project ID from Railway settings        │
├─────────────────────────────────────────────────────────────────┤
│ RAILWAY_SERVICE_ID    │ Service ID from Railway settings        │
├─────────────────────────────────────────────────────────────────┤
│ RAILWAY_APP_URL       │ Deployed app URL (for health checks)    │
├─────────────────────────────────────────────────────────────────┤
│ RAILWAY_ENVIRONMENT   │ Optional: production, staging, etc.     │
└─────────────────────────────────────────────────────────────────┘
```

## Success Metrics

```
╔═══════════════════════════════════════════════════════════════╗
║                      KEY METRICS                               ║
╚═══════════════════════════════════════════════════════════════╝

✅ Deployment Success Rate
   • Calculated from deployment history
   • Target: > 95%

✅ Mean Time to Detection (MTTD)
   • Health checks every 15 minutes
   • Maximum: 15 minutes

✅ Mean Time to Recovery (MTTR)
   • Tracked via issue timestamps
   • Depends on team response

✅ Service Uptime
   • Monitored via health endpoint
   • Target: 99.9%

✅ False Positive Rate
   • Tracked via issue comments
   • Target: < 5%
```

## Release Manager Responsibilities

```
╔═══════════════════════════════════════════════════════════════╗
║                 RELEASE MANAGER DUTIES                         ║
╚═══════════════════════════════════════════════════════════════╝

Daily:
  • Monitor GitHub Actions for deployment status
  • Check for new automated issues
  • Respond to critical alerts within 1 hour

Weekly:
  • Review deployment success rates
  • Analyze patterns in failures
  • Update documentation if needed

Monthly:
  • Review deployment history report
  • Audit closed issues for patterns
  • Optimize health check thresholds

Quarterly:
  • Review and update monitoring strategy
  • Test manual intervention procedures
  • Update runbooks based on incidents
```

## Quick Reference Commands

```bash
# Development
npm run dev                   # Start dev server
npm run build                # Build for production
npm test                     # Run tests

# Railway Management
npm run railway:health       # Check service health
npm run railway:check        # Record deployment status
npm run railway:report       # View deployment report

# Manual Health Check (via curl)
curl https://your-app.railway.app/api/health | jq .

# Check GitHub Actions workflows
gh workflow list
gh workflow view railway-deploy
gh workflow view railway-monitor
gh run list --workflow=railway-monitor.yml
```
