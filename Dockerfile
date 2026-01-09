# ============================================
# FabZClean Production Dockerfile
# Multi-stage build for optimized image size
# ============================================

# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including dev)
RUN npm ci
RUN cd client && npm ci

# Copy source code
COPY . .

# Build client and server
RUN npm run build:client
RUN npm run build:server

# Stage 2: Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    sqlite

# Create non-root user for security
RUN addgroup -g 1001 -S fabzclean && \
    adduser -S fabzclean -u 1001 -G fabzclean

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Copy necessary config files
COPY --from=builder /app/shared ./shared

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R fabzclean:fabzclean /app/data

# Create logs directory
RUN mkdir -p /app/logs && chown -R fabzclean:fabzclean /app/logs

# Set ownership
RUN chown -R fabzclean:fabzclean /app

# Switch to non-root user
USER fabzclean

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "dist-server/server.js"]
