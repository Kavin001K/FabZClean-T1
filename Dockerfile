# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the client
RUN npm run build:client

# Production stage
FROM node:18-slim

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built client from builder stage
COPY --from=builder /app/dist ./dist

# Copy server and shared code
COPY server ./server
COPY shared ./shared
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY drizzle.config.ts ./

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["npx", "tsx", "server/minimal-server.ts"]
