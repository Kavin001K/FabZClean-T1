# Deployment Guide

This application can be deployed to multiple platforms. Here's how to deploy correctly:

## Option 1: Netlify (Recommended for Frontend + Serverless Functions)

### Configuration
- **Build Command**: `npm run netlify:build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`

### Environment Variables
Set these in your Netlify dashboard:
```
NODE_VERSION=18
DATABASE_URL=postgresql://your-db-url
VITE_STACK_PROJECT_ID=your-project-id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your-client-key
STACK_SECRET_SERVER_KEY=your-server-key
NEON_REST_API_URL=your-neon-api-url
JWKS_URL=your-jwks-url
```

### Deployment Steps
1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run netlify:build`
3. Set the publish directory to `dist`
4. Add environment variables
5. Deploy

## Option 2: Render (For Full-Stack Deployment)

### Configuration
- **Build Command**: `npm run build:client && npm run build:server`
- **Start Command**: `npm start`
- **Node Version**: 18

### Environment Variables
Set these in your Render dashboard:
```
DATABASE_URL=postgresql://your-db-url
NODE_ENV=production
PORT=3000
```

### Deployment Steps
1. Connect your GitHub repository to Render
2. Choose "Web Service"
3. Set build command to `npm run build:client && npm run build:server`
4. Set start command to `npm start`
5. Add environment variables
6. Deploy

## Option 3: Vercel (Alternative)

### Configuration
- **Build Command**: `npm run netlify:build`
- **Output Directory**: `dist`
- **Framework Preset**: Other

### Environment Variables
Same as Netlify

## Current Issue Resolution

The error you're seeing:
```
Error: Cannot find module '/opt/render/project/src/dist/index.js'
```

This happens because:
1. You're deploying to Render but using Netlify configuration
2. The build command is only building the frontend (`vite build`)
3. The start command is trying to run a server file that doesn't exist

### Fix for Render Deployment:
1. Update your Render service settings:
   - **Build Command**: `npm run build:client && npm run build:server`
   - **Start Command**: `npm start`
2. Make sure you have the server build output in `dist/server/`

### Fix for Netlify Deployment:
1. Make sure you're deploying to Netlify, not Render
2. Use the `netlify.toml` configuration
3. Build command should be `npm run netlify:build`

## Quick Fix Commands

To build everything locally:
```bash
npm run build:client && npm run build:server
```

To test locally:
```bash
npm start
```

## Troubleshooting

### If you see "Cannot find module" errors:
1. Check that the build command includes both client and server builds
2. Verify the start command points to the correct server file
3. Ensure all dependencies are installed

### If you see "Module not found" errors:
1. Check that your TypeScript compilation is successful
2. Verify all imports are correct
3. Make sure the build output exists in the expected location

## Recommended Deployment Platform

**For this application, I recommend Netlify** because:
1. It's configured for serverless functions
2. The frontend is a SPA that works well with Netlify
3. You already have `netlify.toml` configured
4. The API endpoints are set up as serverless functions

If you want to use Render, you'll need to modify the deployment to build both frontend and backend properly.
