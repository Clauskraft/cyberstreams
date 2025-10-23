#!/bin/bash

# Cyberstreams Online Testing Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL=${PRODUCTION_URL:-"https://cyberstreams.dk"}
STAGING_URL=${STAGING_URL:-"https://staging.cyberstreams.dk"}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"cyberstreams"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${BLUE}🚀 CYBERSTREAMS ONLINE TESTING DEPLOYMENT${NC}"
echo "=================================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed or not in PATH${NC}"
    exit 1
fi

# Build Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -f Dockerfile.online-testing -t ${DOCKER_REGISTRY}/online-testing:${IMAGE_TAG} .

# Test the image locally
echo -e "${YELLOW}🧪 Testing Docker image locally...${NC}"
docker run --rm \
  -e ONLINE_BASE_URL=${PRODUCTION_URL} \
  -e STAGING_BASE_URL=${STAGING_URL} \
  ${DOCKER_REGISTRY}/online-testing:${IMAGE_TAG}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Local test passed${NC}"
else
    echo -e "${RED}❌ Local test failed${NC}"
    exit 1
fi

# Push to registry (if registry is specified)
if [ ! -z "$DOCKER_REGISTRY" ] && [ "$DOCKER_REGISTRY" != "cyberstreams" ]; then
    echo -e "${YELLOW}📤 Pushing image to registry...${NC}"
    docker push ${DOCKER_REGISTRY}/online-testing:${IMAGE_TAG}
fi

# Deploy with docker-compose
echo -e "${YELLOW}🚀 Deploying online testing services...${NC}"
docker-compose -f docker-compose.online-testing.yml up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service status
echo -e "${YELLOW}📊 Checking service status...${NC}"
docker-compose -f docker-compose.online-testing.yml ps

# Run initial health check
echo -e "${YELLOW}🔍 Running initial health check...${NC}"
docker-compose -f docker-compose.online-testing.yml run --rm quick-health-check

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Online testing deployment successful!${NC}"
    echo -e "${BLUE}📋 Services deployed:${NC}"
    echo "  - Online Smoketest: Available"
    echo "  - Online Monitor: Running continuously"
    echo "  - Quick Health Check: Available"
    echo ""
    echo -e "${BLUE}🔗 URLs:${NC}"
    echo "  - Production: ${PRODUCTION_URL}"
    echo "  - Staging: ${STAGING_URL}"
    echo ""
    echo -e "${BLUE}📊 Monitoring:${NC}"
    echo "  - Logs: docker-compose -f docker-compose.online-testing.yml logs -f"
    echo "  - Status: docker-compose -f docker-compose.online-testing.yml ps"
    echo "  - Stop: docker-compose -f docker-compose.online-testing.yml down"
else
    echo -e "${RED}❌ Online testing deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"


