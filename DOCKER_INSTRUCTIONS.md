# FabZClean Docker Deployment Guide

This guide details how to build and run the FabZClean application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

## Quick Start

1. **Build the container:**
   ```bash
   docker-compose build
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Verify it's running:**
   Open your browser and navigate to: [http://localhost:5000](http://localhost:5000)

## Application Data & Logs

The application is configured to persist important data:

- **Database**: Stored in the `fabzclean-data` volume.
- **Logs**: Stored in the `fabzclean-logs` volume.

You can inspect logs using:
```bash
docker-compose logs -f fabzclean
```

## Environment Variables

The `docker-compose.yml` file defaults to production settings. You can override these by creating a `.env` file in the same directory, or by modifying the `environment` section in `docker-compose.yml` directly.

Key variables:
- `PORT`: Content server port (default: 5000)
- `JWT_SECRET`: Secret for authentication (Change this for production!)
- `DATABASE_PATH`: Path to SQLite DB (Default: /app/data/fabzclean.db)

## Building Manually (Without Compose)

If you prefer to run `docker` commands directly:

1. **Build the image:**
   ```bash
   docker build -t fabzclean .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     -p 5000:5000 \
     -v fabzclean_data:/app/data \
     -v fabzclean_logs:/app/logs \
     --name fabzclean-app \
     fabzclean
   ```

## Troubleshooting

- **Build Fails**: Ensure you are in the root directory and `package.json` exists.
- **Updates**: To update the application after code changes:
  ```bash
  docker-compose down
  docker-compose build --no-cache
  docker-compose up -d
  ```
