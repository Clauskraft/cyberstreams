# Railway Deployment Setup Guide

This guide will help you deploy Cyberstreams to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app/)
- GitHub account with access to this repository
- Basic understanding of environment variables

## Quick Start

### 1. Create a New Project on Railway

1. Go to https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose the `cyberstreams` repository
5. Railway will automatically detect the configuration

### 2. Configure Environment Variables

In your Railway project dashboard, add the following environment variables:

#### Required Variables

```env
PORT=3000
NODE_ENV=production
```

#### PostgreSQL Database (Automatically Provided by Railway)

Railway provides a PostgreSQL database. Add it to your project:
1. Click "+ New" in your project
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create `DATABASE_URL` variable

Or set manually:
```env
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=cyberstreams
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
```

#### Optional Integration Variables

**MISP Integration** (if using):
```env
MISP_BASE_URL=https://your-misp-instance.com
MISP_API_KEY=your-misp-api-key
MISP_VERIFY_TLS=true
```

**OpenCTI Integration** (if using):
```env
OPENCTI_API_URL=https://your-opencti-instance.com:8080
OPENCTI_PUBLIC_URL=https://your-opencti-instance.com
OPENCTI_TOKEN=your-opencti-token
```

**Vector Database** (if using):
```env
VECTOR_DB_URL=http://your-vector-db:6333
VECTOR_DB_API_KEY=your-vector-api-key
```

**Ingestion Pipeline**:
```env
INGESTION_LOG_LEVEL=info
AUTO_SEED_SOURCES=true
AUTO_START_INTEL_SCRAPER=true
```

### 3. Deploy

Railway will automatically deploy when you:
- Push to the `main` branch (if GitHub integration is enabled)
- Click "Deploy" in the Railway dashboard

The deployment process:
1. Builds the Docker container using `Dockerfile`
2. Installs dependencies
3. Builds the frontend with Vite
4. Starts the Node.js server
5. Provides a public URL

### 4. Access Your Application

After deployment:
1. Railway provides a public URL (e.g., `https://cyberstreams-production.up.railway.app`)
2. You can add a custom domain in Railway settings

## Deployment Configuration

### Files Used

- `Dockerfile`: Multi-stage Docker build configuration
- `railway.json`: Railway-specific settings
- `.railwayignore`: Files to exclude from deployment
- `package.json`: Dependencies and build scripts

### Build Process

The Dockerfile performs a multi-stage build:

**Stage 1 - Build:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Stage 2 - Production:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY server.js lib ./
EXPOSE 3000
CMD ["node", "server.js"]
```

## Monitoring

### View Logs

In Railway dashboard:
1. Go to your project
2. Click on the service
3. Select "Logs" tab
4. View real-time application logs

### Check Health

The application includes a health check endpoint:
```
GET /api/health
```

Response:
```json
{
  "status": "operational",
  "timestamp": "2025-10-20T07:00:00.000Z",
  "version": "1.4.0"
}
```

## Troubleshooting

### Build Fails

**Issue**: Build fails with dependency errors

**Solution**:
1. Check `package.json` for correct dependencies
2. Ensure `package-lock.json` is committed
3. Try running `npm ci` locally to verify

### Server Crashes on Startup

**Issue**: Application crashes immediately after starting

**Solution**:
1. Check Railway logs for error messages
2. Verify environment variables are set correctly
3. Ensure PostgreSQL database is accessible
4. Check `DATABASE_URL` format

### Database Connection Issues

**Issue**: Cannot connect to PostgreSQL

**Solution**:
1. Verify database service is running
2. Check `DATABASE_URL` is set correctly
3. Ensure network connectivity between services
4. Check firewall/security group settings

### Performance Issues

**Issue**: Application is slow or unresponsive

**Solution**:
1. Check Railway metrics for resource usage
2. Consider upgrading Railway plan if needed
3. Enable caching for API responses
4. Optimize database queries

## Scaling

Railway provides:
- **Vertical Scaling**: Upgrade CPU/RAM resources
- **Horizontal Scaling**: Add more replicas (Pro plan)
- **Auto-scaling**: Based on resource usage (Enterprise plan)

To scale:
1. Go to project settings
2. Select "Resources" tab
3. Adjust CPU/RAM or replica count

## Rollback

To rollback to a previous deployment:
1. Go to "Deployments" tab
2. Find the previous working deployment
3. Click "..." menu
4. Select "Redeploy"

## Custom Domain

To add a custom domain:
1. Go to project settings
2. Select "Domains" tab
3. Click "Add Domain"
4. Enter your domain (e.g., cyberstreams.dk)
5. Update DNS records as instructed

DNS Configuration:
```
Type: CNAME
Name: @
Value: [provided by Railway]
```

## CI/CD Integration

Railway automatically deploys from GitHub when:
- Changes are pushed to `main` branch
- Pull request is merged

To disable auto-deploy:
1. Go to project settings
2. Select "GitHub" tab
3. Toggle "Auto Deploy" off

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Database Access**: Use Railway's internal network
3. **API Keys**: Rotate regularly and store securely
4. **HTTPS**: Always enabled by Railway
5. **Rate Limiting**: Implement in application code
6. **Authentication**: Add user authentication for admin features

## Cost Optimization

Railway offers:
- **Free Tier**: $5 credit per month (hobby projects)
- **Pro Plan**: $20/month + usage-based pricing
- **Enterprise**: Custom pricing

Tips to reduce costs:
1. Use appropriate resource allocation
2. Enable caching to reduce database queries
3. Optimize Docker image size
4. Scale down during off-peak hours
5. Use Railway's sleep feature for development

## Support

- **Railway Documentation**: https://docs.railway.app/
- **Railway Community**: https://discord.gg/railway
- **Project Issues**: https://github.com/Clauskraft/cyberstreams/issues

## Next Steps

After deployment:
1. Test all API endpoints
2. Verify database connectivity
3. Configure integrations (MISP, OpenCTI)
4. Set up monitoring and alerts
5. Add custom domain
6. Enable backups for database
7. Document your configuration

---

**Note**: This application can run without external integrations. MISP, OpenCTI, and Vector DB are optional and only needed for advanced threat intelligence features.
