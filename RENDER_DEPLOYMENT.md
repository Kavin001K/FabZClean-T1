# FabZClean - Render.com Deployment Guide

This guide explains how to deploy FabZClean to Render.com.

## Prerequisites

- GitHub repository with your FabZClean code
- Render.com account

## Deployment Steps

### 1. Automatic Deployment (Recommended)

1. **Connect Repository**: 
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables** (if needed):
   - `NODE_ENV`: `production` (automatically set)
   - `PORT`: `10000` (automatically set by Render)

### 2. Manual Deployment

If you prefer manual setup:

1. **Create Web Service**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `fabzclean-app`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: `Starter` (or higher)

2. **Add Persistent Disk** (for SQLite database):
   - In your service settings, go to "Disks"
   - Click "Add Disk"
   - **Name**: `fabzclean-disk`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: `1 GB` (or as needed)

## Configuration Details

### Environment Variables

The following environment variables are automatically configured:

- `NODE_ENV=production`
- `PORT=10000` (Render's default)
- `NODE_OPTIONS=--max-old-space-size=512`
- `VITE_BUILD_TARGET=production`

### Database

- **Type**: SQLite (file-based)
- **Location**: `/opt/render/project/src/data/fabzclean.db` (on persistent disk)
- **Backup**: Automatically handled by Render's disk persistence

### Build Process

1. **Client Build**: Vite builds the React frontend to `dist/`
2. **Server Build**: TypeScript compiles server code to `dist/server/`
3. **Static Serving**: Express serves the built client files

## Features

✅ **Fully Offline Capable**: No external database dependencies
✅ **Persistent Data**: SQLite database on persistent disk
✅ **WebSocket Support**: Real-time features work out of the box
✅ **Auto-scaling**: Render handles scaling automatically
✅ **HTTPS**: Automatic SSL certificates
✅ **Custom Domain**: Easy to configure custom domains

## Health Check

The service includes a health check endpoint at `/api/health/database` that Render uses to monitor service health.

## Troubleshooting

### Build Issues

If the build fails:
1. Check the build logs in Render dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility (18+)

### Database Issues

If database operations fail:
1. Check that the persistent disk is properly mounted
2. Verify the disk has sufficient space
3. Check server logs for SQLite errors

### Performance Issues

For better performance:
1. Upgrade to a higher Render plan
2. Increase the persistent disk size if needed
3. Monitor memory usage in Render dashboard

## Scaling

- **Horizontal**: Render can run multiple instances
- **Vertical**: Upgrade to higher CPU/memory plans
- **Database**: SQLite handles moderate loads well

## Costs

- **Starter Plan**: $7/month (512MB RAM, 0.1 CPU)
- **Standard Plan**: $25/month (2GB RAM, 1 CPU)
- **Persistent Disk**: $0.25/GB/month

## Support

For deployment issues:
1. Check Render's documentation
2. Review build and runtime logs
3. Contact Render support if needed

---

**Your FabZClean app will be available at**: `https://your-service-name.onrender.com`
