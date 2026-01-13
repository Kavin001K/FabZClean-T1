# Render Deployment Configuration

## ⚠️ IMPORTANT: This is a WEB APPLICATION (NOT Electron)

This application has been converted from an Electron desktop app to a pure web application.

## Required Render Settings

### Build Settings
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node start.js` (or `npm start`)

### ✅ What the start.js does:
The `start.js` wrapper ensures the correct server starts regardless of any dashboard overrides. It automatically launches the Express server using `tsx server/index.ts`.

### ❌ WRONG Configuration (DO NOT USE)
- ~~`node electron/main.js`~~ - This will fail as Electron has been removed
- ~~Any electron-related commands~~ - Electron dependencies have been completely removed

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

## Persistent Disk (IMPORTANT)

For database persistence, you need to create a persistent disk in Render:

1. Go to your service in Render dashboard
2. Go to **Disks** section
3. Click **Add Disk**
4. Configure:
   - **Name:** `fabzclean-disk`
   - **Mount Path:** `/opt/render/project/src/data`
   - **Size:** 1 GB (or as needed)
5. Click **Create Disk**

**Note:** Without the disk, the app will use `/tmp` which is ephemeral and data will be lost on restart. The disk is already configured in `render.yaml` but must be manually created in the dashboard.

## Manual Dashboard Override

If you're still seeing the Electron error, you have a **manual override** in your Render dashboard that needs to be updated:

1. Go to your Render dashboard
2. Select your service
3. Go to **Settings** → **Build & Deploy**
4. Update the **Start Command** to: `node start.js` (or clear it to use render.yaml)
5. **IMPORTANT**: Make sure the **Branch** is set to `main` (not an old commit)
6. Click **Save Changes**
7. **Manual Deploy** to trigger a new deployment

### Branch/Commit Issue
If Render is checking out an old commit (e.g., `ef7b0266`), ensure:
- Auto-deploy is enabled for the `main` branch
- No manual commit hash is specified in settings
- The service is connected to the correct repository and branch

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
