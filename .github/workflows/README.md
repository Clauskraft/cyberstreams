# GitHub Actions Workflows

This directory contains automated workflows for the Cyberstreams project.

## Workflows

### 1. Deploy to Cloudflare Pages (`deploy-cloudflare.yml`)

Automatically builds and deploys the Vite React application to Cloudflare Pages.

#### Triggers
- **Automatic**: Push to `main` branch (with path filters to avoid unnecessary deployments)
- **Manual**: Workflow dispatch from GitHub Actions tab

#### Prerequisites

Before the workflow can run successfully, repository maintainers must configure the following secrets:

##### Required Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions → New repository secret**

1. **`CLOUDFLARE_API_TOKEN`**
   - **Description**: API token with Cloudflare Pages Edit permissions
   - **How to create**:
     1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
     2. Click "Create Token"
     3. Use the "Edit Cloudflare Workers" template or create a custom token with these permissions:
        - Account → Cloudflare Pages → Edit
        - Account → Account Settings → Read
        - User → User Details → Read
     4. Set Account Resources to include: `23b3799e11009b55048086157faff1a1`
     5. Copy the generated token and add it as a secret

2. **`CLOUDFLARE_ACCOUNT_ID`**
   - **Description**: Your Cloudflare account identifier
   - **Value**: `23b3799e11009b55048086157faff1a1`
   - **How to find**:
     - Available in the Cloudflare Dashboard URL
     - Or go to Workers & Pages → Overview, check the URL

##### Cloudflare Pages Project

The workflow deploys to a Cloudflare Pages project named **`cyberstreams`**.

**Action Required**: Ensure this project exists in your Cloudflare account:
1. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages)
2. If the project doesn't exist, the first deployment will create it automatically
3. Alternatively, create it manually:
   - Click "Create a project"
   - Select "Direct Upload"
   - Name it `cyberstreams`

#### Workflow Behavior

1. **Path Filtering**: Only deploys when relevant files change:
   - Source code (`src/**`)
   - Public assets (`public/**`)
   - Configuration files (package.json, vite.config.ts, etc.)
   - The workflow file itself

2. **Build Process**:
   - Installs Node.js 20
   - Installs dependencies (uses `npm ci` if package-lock.json exists)
   - Runs `npm run build` to create production bundle
   - Deploys `dist/` directory to Cloudflare Pages

3. **Security**:
   - Minimal permissions (contents: read, deployments: write, id-token: write)
   - No secrets committed to repository
   - Uses GitHub's OIDC for secure authentication

#### Manual Deployment

To manually trigger a deployment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Cloudflare Pages** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow** button

#### Deployment URL

After successful deployment, your application will be available at:
- **Production**: https://cyberstreams.pages.dev
- **Custom Domain**: Configure in Cloudflare Dashboard → Pages → cyberstreams → Custom domains

#### Troubleshooting

**Deployment fails with authentication error:**
- Verify `CLOUDFLARE_API_TOKEN` is set correctly
- Check token hasn't expired (tokens can be set to expire)
- Ensure token has correct permissions

**Deployment fails with "project not found":**
- Verify `CLOUDFLARE_ACCOUNT_ID` matches your account
- Create the Pages project manually in Cloudflare Dashboard
- Check project name is exactly `cyberstreams` (case-sensitive)

**Build fails:**
- Check the build logs in the Actions tab
- Verify all dependencies are listed in package.json
- Test build locally with `npm run build`

#### Status Badge

Add this badge to your README.md to show deployment status:

```markdown
[![Deploy to Cloudflare Pages](https://github.com/Clauskraft/cyberstreams/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/Clauskraft/cyberstreams/actions/workflows/deploy-cloudflare.yml)
```

---

### 2. Claude Code Review (`claude-code-review.yml`)

Automatically reviews pull requests using Claude AI.

### 3. Claude Assistant (`claude.yml`)

Interactive Claude assistant triggered by `@claude` mentions in issues and PRs.

## Support

For issues with workflows, please open an issue in the repository.
