# Render Deployment Configuration

## ⚠️ IMPORTANT: This is a WEB APPLICATION (NOT Electron)

This application has been converted from an Electron desktop app to a pure web application.

## Required Render Settings

### Build Settings
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npx tsx server/index.ts` (or `npm start`)

### ❌ WRONG Configuration (DO NOT USE)
- ~~`node electron/main.js`~~ - This will fail as Electron has been removed

## Environment Variables

Set these in your Render dashboard:

```
NODE_ENV=production
PORT=10000
NODE_OPTIONS=--max-old-space-size=512
VITE_BUILD_TARGET=production
```

## Health Check
- **Health Check Path:** `/api/health/database`

## Manual Dashboard Override

If you're still seeing the Electron error, you have a **manual override** in your Render dashboard that needs to be updated:

1. Go to your Render dashboard
2. Select your service
3. Go to **Settings** → **Build & Deploy**
4. Update the **Start Command** to: `npx tsx server/index.ts`
5. Click **Save Changes**
6. **Manual Deploy** to trigger a new deployment

## Auto-deploy from Git

The `render.yaml` file in the repository root configures everything automatically. If Render is not respecting it, check for manual overrides in the dashboard.

## Verification

After deployment, the app should:
- Start the Express server on port 10000
- Serve the React frontend from the `/dist` folder
- Respond to API requests at `/api/*` endpoints
- Pass health check at `/api/health/database`

## Troubleshooting

If you see "Cannot find module '/opt/render/project/src/electron/main.js'":
- This means the start command is still set to the old Electron command
- Update the start command in Render dashboard settings
- Re-deploy the application
