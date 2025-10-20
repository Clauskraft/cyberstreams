#!/bin/bash

# 🚀 CYBERSTREAMS - CLOUDFLARE DEPLOYMENT SCRIPT
# ===============================================

echo "🔐 CLOUDFLARE DEPLOYMENT FOR CYBERSTREAMS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_API_TOKEN not found in environment${NC}"
    echo ""
    echo "To deploy to Cloudflare, you need an API token with the following permissions:"
    echo "  • Account → Cloudflare Pages → Edit"
    echo "  • Account → Account Settings → Read"
    echo "  • User → User Details → Read"
    echo ""
    echo "Get your token here: https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    read -p "Enter your Cloudflare API token: " token
    export CLOUDFLARE_API_TOKEN="$token"
    echo ""
fi

echo -e "${BLUE}📦 Step 1: Checking build output...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist/ folder not found. Running build...${NC}"
    npm run build
fi
echo -e "${GREEN}✅ Build files ready${NC}"
echo ""

echo -e "${BLUE}☁️  Step 2: Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=cyberstreams

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Your app is live at:${NC}"
    echo -e "${BLUE}   https://cyberstreams.pages.dev${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Alternative deployment methods:"
    echo "1. Manual upload via Cloudflare Dashboard:"
    echo "   → https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/workers-and-pages/create"
    echo "   → Upload the dist/ folder"
    echo ""
    echo "2. Check API token permissions"
    echo "   → https://dash.cloudflare.com/profile/api-tokens"
    echo ""
fi
