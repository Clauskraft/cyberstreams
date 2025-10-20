#!/usr/bin/env bash
# Script to configure GitHub branch protection and repository labels using GitHub CLI
# Usage: ./scripts/gh-branch-protection.sh

set -euo pipefail

REPO="Clauskraft/cyberstreams"
BRANCH="main"

echo "🔒 Configuring branch protection for ${REPO}..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/manual/installation"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Enable branch protection for main branch
echo "Setting up branch protection rules for '${BRANCH}'..."
gh api repos/${REPO}/branches/${BRANCH}/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=ci \
  --field required_status_checks[contexts][]=codeql \
  --field required_status_checks[contexts][]=security \
  --field enforce_admins=false \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=true \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field restrictions=null \
  --field required_linear_history=false \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false \
  --field required_conversation_resolution=true \
  2>/dev/null || echo "⚠️  Branch protection may already be configured or requires admin access"

echo "✅ Branch protection configured"

# Create repository labels
echo "Creating repository labels..."

LABELS=(
  "bug:d73a4a:Something isn't working"
  "enhancement:a2eeef:New feature or request"
  "documentation:0075ca:Improvements or additions to documentation"
  "dependencies:0366d6:Pull requests that update a dependency"
  "security:d93f0b:Security vulnerability or concern"
  "performance:fbca04:Performance improvements"
  "ci:00ff00:Continuous integration changes"
  "triage:ffffff:Needs triage"
  "good first issue:7057ff:Good for newcomers"
  "help wanted:008672:Extra attention is needed"
  "wontfix:ffffff:This will not be worked on"
  "duplicate:cfd3d7:This issue or pull request already exists"
  "invalid:e4e669:This doesn't seem right"
  "question:d876e3:Further information is requested"
  "npm:e99695:NPM dependency updates"
  "github-actions:2188ff:GitHub Actions updates"
)

for label in "${LABELS[@]}"; do
  IFS=':' read -r name color description <<< "$label"
  gh api repos/${REPO}/labels \
    --method POST \
    --field name="${name}" \
    --field color="${color}" \
    --field description="${description}" \
    2>/dev/null || echo "⚠️  Label '${name}' may already exist"
done

echo "✅ Repository labels created"

echo ""
echo "🎉 Repository configuration complete!"
echo ""
echo "Branch protection settings:"
echo "  - Branch: ${BRANCH}"
echo "  - Required status checks: ci, codeql, security"
echo "  - Required approving reviews: 1"
echo "  - Code owner review required: true"
echo "  - Dismiss stale reviews: true"
echo "  - Require conversation resolution: true"
echo ""
echo "Note: Some settings may require repository admin access to apply."
