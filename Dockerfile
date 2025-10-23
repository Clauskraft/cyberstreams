# Multi-stage build: First build the frontend, then serve with Node.js

# Stage 1: Build frontend with Node
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Production runtime
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server.js and lib directory
COPY server.js .
COPY lib ./lib

# Copy data directory
COPY data ./data

# Copy public assets if any (optional)
COPY public ./public || true

# Expose port (Railway sets PORT env var)
EXPOSE 3001

# Health check using API health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error('status ' + r.statusCode)})"

# Start the server
CMD ["node", "server.js"]
