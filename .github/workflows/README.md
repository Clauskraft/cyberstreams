# GitHub Actions Workflows

This directory contains automated workflows for the Cyberstreams project.

## Workflows

### 1. Railway Deploy (`railway-deploy.yml`)

Automatically deploys the application to Railway platform.

#### Triggers
- **Automatic**: Push to `main` branch
- **Manual**: Workflow dispatch from GitHub Actions tab

#### Prerequisites

The application is configured to deploy to Railway, which provides:
- Automatic deployments on git push
- PostgreSQL database hosting
- Environment variable management
- HTTPS endpoints

#### Deployment Process

Railway handles deployment automatically through its GitHub integration. The workflow:
1. Monitors changes to the repository
2. Builds the Docker container or uses Nixpacks
3. Deploys to Railway infrastructure
4. Provides deployment URLs and logs

---

### 2. Claude Code Review (`claude-code-review.yml`)

Automated code review using Claude AI.

#### Triggers
- Pull request events

---

### 3. Claude Workflow (`claude.yml`)

General Claude AI integration for development tasks.

---

## Local Development

To run the application locally:

```bash
# Install dependencies
npm ci

# Build frontend
npm run build

# Start server
npm start
```

The application will be available at `http://localhost:3001`.

## Environment Variables

Required environment variables (see `.env.example`):

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_*`: Database connection details
- `MISP_*`: MISP integration settings
- `OPENCTI_*`: OpenCTI integration settings

## Deployment

### Railway Deployment

The application is configured for Railway deployment using:
- `railway.json`: Railway configuration
- `Dockerfile`: Container build instructions
- `.railwayignore`: Files to exclude from deployment

Railway automatically deploys when changes are pushed to the `main` branch.

---

## Adding More Workflows

When adding new workflows:

1. Create a `.yml` file in this directory
2. Follow GitHub Actions syntax
3. Use minimal permissions principle
4. Add secrets via Repository Settings (never commit them)
5. Document the workflow in this README
