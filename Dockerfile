# Use official Node.js runtime as parent image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy application source code
COPY . .

# Build the frontend and backend
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port (Cloud Run uses PORT, default is 8080)
EXPOSE 8080

# Start command
CMD ["npm", "run", "start:prod"]
