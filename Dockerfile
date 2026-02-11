# Backend Dockerfile for Voicetudu API
# Multi-stage build for optimization

FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development dependencies stage
FROM base AS dependencies
RUN npm ci

# Production dependencies stage
FROM base AS production-dependencies
RUN npm ci --only=production && npm cache clean --force

# Build stage (if needed for TypeScript or other build steps)
FROM dependencies AS build
COPY . .
# Add any build steps here if needed
# RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=production-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "src/server.js"]
