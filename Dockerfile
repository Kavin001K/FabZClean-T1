# ==========================================
# FABZCLEAN PRODUCTION DOCKERFILE
# Multi-stage build for smaller final image
# ==========================================

# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set memory limit for Node.js build (prevents OOM on small instances)
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (need dev deps for build)
RUN npm ci

# Copy source code
COPY . .

# Build the client AND server
RUN npm run build

# Production stage
FROM node:22-slim

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
# Also install curl for healthchecks
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built client from builder stage
COPY --from=builder /app/dist ./dist

# Copy built server from builder stage
COPY --from=builder /app/dist-server ./dist-server

# Copy server source (needed for some dynamic imports)
COPY server ./server
COPY shared ./shared

# Copy config files
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Create directories for runtime
RUN mkdir -p logs uploads

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the compiled server (not tsx)
CMD ["node", "dist-server/server.js"]
