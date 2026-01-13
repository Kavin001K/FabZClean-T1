# FabZClean - Render.com Deployment Guide

This application is **optimized for Render.com** deployment.

## 🚀 Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)

1. **Fork or Clone** this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Render will **auto-detect** `render.yaml` and configure everything automatically
6. Click **Create Web Service**

### Option 2: Manual Setup

If auto-detection doesn't work:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will use the `render.yaml` configuration

## 📋 Configuration Details

### Automatic Configuration (from render.yaml)

The `render.yaml` file configures:

- **Runtime:** Node.js (latest)
- **Region:** Oregon (change in render.yaml if needed)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node start.js`
- **Health Check:** `/api/health/database`
- **Auto Deploy:** Enabled (deploys on every git push)

### Environment Variables

These are set automatically from `render.yaml`:

```env
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=512
VITE_BUILD_TARGET=production
PORT=<automatically set by Render>
```

**No manual configuration needed!**

## 💾 Setting Up Persistent Storage (REQUIRED)

Your database needs persistent storage. The disk is configured in `render.yaml` but you need to **create it in the dashboard**:

### Steps:

1. After your service is created, go to your service dashboard
2. Click on the **Disks** tab (left sidebar)
3. Click **Add Disk**
4. Use these **exact** settings:
   - **Name:** `fabzclean-disk`
   - **Mount Path:** `/opt/render/project/src/data`
   - **Size:** 1 GB (or more if needed)
5. Click **Create Disk**
6. **Important:** Redeploy your service after creating the disk

### Without Persistent Disk:

⚠️ The app will work but use `/tmp` for the database
- Data will be **lost on every restart**
- Only suitable for testing

### With Persistent Disk:

✅ Database persists across restarts and deployments
✅ Production-ready setup

## 🔍 Health Checks

The application provides health check endpoints:

- **Primary:** `/api/health/database` - Full database health check
- **Ping:** `/api/health/ping` - Quick ping test
- **Info:** `/api/database/info` - Database statistics

Render uses `/api/health/database` to monitor your service.

## 🌍 Regions

Default region is **Oregon**. To change:

1. Edit `render.yaml` line 6
2. Available regions:
   - `oregon` (US West)
   - `frankfurt` (Europe)
   - `singapore` (Asia)
   - `ohio` (US East)

## 🔄 Auto-Deploy

**Enabled by default.** Every push to `main` branch automatically deploys.

To disable:
- Go to **Settings** → **Build & Deploy**
- Toggle off **Auto-Deploy**

## 📊 Monitoring

### Built-in Render Monitoring:

- CPU/Memory usage
- Response times
- Error rates
- Health check status

### Application Logs:

View in Render dashboard:
- **Logs** tab shows real-time server logs
- Look for these startup messages:
  ```
  🚀 Starting FabZClean Web Server...
  🗄️  Database path: /opt/render/project/src/data/fabzclean.db
  🗄️  Initializing SQLite database at: ...
  ✅ SQLite database initialized successfully
  serving on port <port>
  ```

## 🐛 Troubleshooting

### ❌ "Cannot find module electron"

**Fixed!** This error should never appear now. If it does:
- Verify you're on the latest commit
- Check start command is `node start.js` (not electron-related)

### ❌ "Directory does not exist"

**Fixed!** The app auto-creates missing directories. If this appears:
1. Check if persistent disk is mounted
2. Verify mount path is `/opt/render/project/src/data`
3. The app will fall back to `/tmp` automatically

### ⚠️ "Using /tmp" warning in logs

This means the persistent disk is not mounted:
1. Go to **Disks** tab
2. Create disk with mount path `/opt/render/project/src/data`
3. Redeploy the service

### 🔴 Health check failing

1. Check logs for database errors
2. Verify disk is mounted (if using persistent storage)
3. Check `/api/health/database` endpoint manually

### 💾 Data not persisting

1. Verify persistent disk is created and mounted
2. Check logs for "Database path:" message
3. Should show `/opt/render/project/src/data/fabzclean.db` (not `/tmp`)

## 🔐 Security Notes

- HTTPS is automatic on Render
- Environment variables are encrypted
- Database is private to your service
- No additional security setup needed

## 💰 Pricing

**Starter Plan** (Free):
- 750 hours/month free
- Spins down after 15 minutes of inactivity
- Enough for testing and small projects

**Paid Plans:**
- Always-on service
- More resources
- Production-ready

## 📈 Scaling

To upgrade:
1. Go to **Settings** → **Instance Type**
2. Choose a larger plan
3. Service will be upgraded with zero downtime

## 🔗 Custom Domain

1. Go to **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Follow DNS configuration instructions
4. SSL certificate is provisioned automatically

## 🚦 Deployment Checklist

- [x] `render.yaml` configured
- [x] Health check endpoint working
- [x] Start script (`start.js`) in place
- [x] Database auto-initialization
- [x] Directory auto-creation
- [ ] Create persistent disk in dashboard
- [ ] Verify deployment logs
- [ ] Test health check endpoint
- [ ] Verify data persists after restart

## 🆘 Support

**Render Issues:**
- [Render Status Page](https://status.render.com/)
- [Render Community](https://community.render.com/)
- [Render Docs](https://render.com/docs)

**Application Issues:**
- Check application logs in Render dashboard
- Review health check endpoint
- Verify database connectivity

## 📝 Quick Reference

| Setting | Value |
|---------|-------|
| Runtime | Node.js (auto-detected) |
| Build Command | `npm install && npm run build` |
| Start Command | `node start.js` |
| Health Check | `/api/health/database` |
| Disk Mount Path | `/opt/render/project/src/data` |
| Region | Oregon (configurable) |
| Auto-Deploy | Enabled |

---

**🎉 That's it! Your FabZClean app is ready for Render.com deployment!**
