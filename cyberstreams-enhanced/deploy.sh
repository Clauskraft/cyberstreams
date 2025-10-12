#!/bin/bash

# Cyberstreams Cloudflare Deployment Script
# This script automates the deployment process to Cloudflare

set -e

echo "🚀 Cyberstreams Cloudflare Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not logged in to Cloudflare. Running login..."
    wrangler login
fi
print_status "Authenticated with Cloudflare"

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_status "Loaded environment variables from .env"
fi

# Step 1: Create Cloudflare resources
echo ""
echo "Step 1: Creating Cloudflare Resources"
echo "--------------------------------------"

# Create KV namespaces
echo "Creating KV namespace..."
KV_CREATE_OUTPUT=$(wrangler kv:namespace create "CACHE" 2>&1 || true)
if [[ $KV_CREATE_OUTPUT == *"already exists"* ]]; then
    print_warning "KV namespace 'CACHE' already exists"
else
    KV_ID=$(echo $KV_CREATE_OUTPUT | grep -oP 'id = "\K[^"]+')
    print_status "Created KV namespace: $KV_ID"
    
    # Update wrangler.toml with KV namespace ID
    if [ ! -z "$KV_ID" ]; then
        sed -i.bak "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
    fi
fi

# Create preview KV namespace
KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create "CACHE" --preview 2>&1 || true)
if [[ $KV_PREVIEW_OUTPUT == *"already exists"* ]]; then
    print_warning "Preview KV namespace already exists"
else
    KV_PREVIEW_ID=$(echo $KV_PREVIEW_OUTPUT | grep -oP 'id = "\K[^"]+')
    if [ ! -z "$KV_PREVIEW_ID" ]; then
        sed -i.bak "s/YOUR_PREVIEW_KV_ID/$KV_PREVIEW_ID/g" wrangler.toml
    fi
fi

# Create D1 database
echo "Creating D1 database..."
D1_CREATE_OUTPUT=$(wrangler d1 create cyberstreams-db 2>&1 || true)
if [[ $D1_CREATE_OUTPUT == *"already exists"* ]]; then
    print_warning "D1 database already exists"
else
    D1_ID=$(echo $D1_CREATE_OUTPUT | grep -oP 'database_id = "\K[^"]+')
    print_status "Created D1 database: $D1_ID"
    
    # Update wrangler.toml with D1 database ID
    if [ ! -z "$D1_ID" ]; then
        sed -i.bak "s/YOUR_D1_DATABASE_ID/$D1_ID/g" wrangler.toml
    fi
fi

# Create R2 bucket
echo "Creating R2 bucket..."
R2_OUTPUT=$(wrangler r2 bucket create cyberstreams-storage 2>&1 || true)
if [[ $R2_OUTPUT == *"already exists"* ]]; then
    print_warning "R2 bucket already exists"
else
    print_status "Created R2 bucket: cyberstreams-storage"
fi

# Step 2: Initialize D1 Database
echo ""
echo "Step 2: Initializing D1 Database"
echo "---------------------------------"

if [ -f scripts/d1-schema.sql ]; then
    echo "Running D1 migrations..."
    wrangler d1 execute cyberstreams-db --file=scripts/d1-schema.sql
    print_status "D1 database schema initialized"
else
    print_error "D1 schema file not found at scripts/d1-schema.sql"
fi

# Step 3: Build the project
echo ""
echo "Step 3: Building the Project"
echo "-----------------------------"

echo "Installing dependencies..."
npm install
print_status "Dependencies installed"

echo "Building production bundle..."
npm run build
print_status "Production build complete"

# Step 4: Set environment secrets
echo ""
echo "Step 4: Setting Environment Secrets"
echo "------------------------------------"

# Function to set secret if not empty
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ ! -z "$secret_value" ]; then
        echo "$secret_value" | wrangler secret put $secret_name
        print_status "Set secret: $secret_name"
    else
        print_warning "Skipping $secret_name (not set in .env)"
    fi
}

# Set secrets from environment
echo "Setting API secrets..."
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
set_secret "API_KEY" "$API_KEY"
set_secret "JWT_SECRET" "$JWT_SECRET"

# Step 5: Deploy Worker
echo ""
echo "Step 5: Deploying Worker"
echo "------------------------"

echo "Deploying to Cloudflare Workers..."
DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract worker URL
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.workers\.dev' | head -1)
if [ ! -z "$WORKER_URL" ]; then
    print_status "Worker deployed to: $WORKER_URL"
else
    print_warning "Could not extract worker URL from deployment output"
fi

# Step 6: Deploy static assets to Pages
echo ""
echo "Step 6: Deploying Static Assets"
echo "--------------------------------"

echo "Deploying to Cloudflare Pages..."
PAGES_OUTPUT=$(wrangler pages deploy dist --project-name=cyberstreams 2>&1)
echo "$PAGES_OUTPUT"

# Extract Pages URL
PAGES_URL=$(echo "$PAGES_OUTPUT" | grep -oP 'https://[^\s]+\.pages\.dev' | head -1)
if [ ! -z "$PAGES_URL" ]; then
    print_status "Pages deployed to: $PAGES_URL"
else
    print_warning "Could not extract Pages URL from deployment output"
fi

# Step 7: Verify deployment
echo ""
echo "Step 7: Verifying Deployment"
echo "-----------------------------"

if [ ! -z "$WORKER_URL" ]; then
    echo "Testing worker endpoint..."
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "$WORKER_URL/api/health" || echo "000")
    
    if [ "$HTTP_STATUS" == "200" ]; then
        print_status "Worker is responding correctly"
    else
        print_warning "Worker returned status code: $HTTP_STATUS"
    fi
fi

# Step 8: Summary
echo ""
echo "========================================="
echo "       Deployment Complete! 🎉"
echo "========================================="
echo ""

if [ ! -z "$WORKER_URL" ]; then
    echo "🔗 Worker URL: $WORKER_URL"
fi

if [ ! -z "$PAGES_URL" ]; then
    echo "🔗 Pages URL: $PAGES_URL"
fi

echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Update your DNS records to point to Cloudflare"
echo "2. Configure custom domain in Cloudflare dashboard"
echo "3. Test the application at the provided URLs"
echo "4. Monitor logs with: wrangler tail"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "View logs:        wrangler tail"
echo "View KV data:     wrangler kv:key list --namespace-id=<id>"
echo "Query D1:         wrangler d1 execute cyberstreams-db --command='SELECT * FROM keywords'"
echo "Rollback:         wrangler rollback"
echo ""

print_status "Deployment script completed successfully!"
