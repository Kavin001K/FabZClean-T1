# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (ignore postinstall as we'll run build separately)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the client explicitly
RUN npm run build:client

# Production stage
FROM node:22-slim

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only (ignore scripts - we don't need to build again)
RUN npm ci --omit=dev --ignore-scripts

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
