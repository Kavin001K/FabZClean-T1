# AWS Amplify Deployment Guide - FabZClean

## Overview

This guide covers deploying FabZClean to AWS Amplify **without Supabase**, using AWS Free Tier services only.

## Architecture - Offline-First Mode

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY (Free Tier)                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Static Website Hosting                      ││
│  │  • Vite React App (SPA)                                      ││
│  │  • Automatic builds from GitHub                              ││
│  │  • Custom domain support                                     ││
│  │  • HTTPS by default                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Browser IndexedDB (Local Storage)               ││
│  │  • All data stored locally in browser                        ││
│  │  • Works offline                                             ││
│  │  • No backend required                                       ││
│  │  • Data persists until browser clears                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## AWS Free Tier Summary

| Service | Free Tier Limits | Usage |
|---------|-----------------|-------|
| **Amplify Hosting** | 1000 build minutes/month, 15 GB storage | Static website |
| **CloudFront** | 1 TB data transfer/month | CDN (included with Amplify) |
| **Route 53** | $0.50/month for hosted zone | Custom domain (optional) |

**Total Monthly Cost: $0 - $0.50** (only if using custom domain)

---

## Deployment Steps

### 1. Prepare Your Repository

```bash
# Ensure you have the latest code
git add .
git commit -m "Ready for AWS Amplify deployment"
git push
```

### 2. Create AWS Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** as your repository source
4. Authorize AWS to access your GitHub account
5. Select your repository: `FabZClean-T1`
6. Select branch: `main` or `master`

### 3. Configure Build Settings

AWS will auto-detect the `amplify.yml` file. Verify settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
        - npm install idb --save
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
```

### 4. Set Environment Variables

In the Amplify Console, go to **App settings** → **Environment variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_OFFLINE_MODE` | `true` | Enable offline-first mode |
| `VITE_APP_NAME` | `FabZClean` | App name |
| `VITE_COMPANY_NAME` | `FabZ Clean` | Company name |

### 5. Deploy

1. Click **"Save and deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Access your app at the Amplify URL: `https://[branch].[app-id].amplifyapp.com`

---

## Login Credentials

After deployment, use these credentials:

| Employee ID | Password | Role | Access |
|-------------|----------|------|--------|
| `myfabclean` | `Durai@2025` | Admin | All data |
| `mgr-pollachi` | `password123` | Manager | Pollachi franchise only |
| `mgr-kin` | `password123` | Manager | Kinathukadavu franchise only |

---

## How Data Works

### Browser LocalDB (IndexedDB)

All data is stored locally in the user's browser using IndexedDB:

- ✅ **Works offline** - App functions without internet
- ✅ **Fast** - No network latency
- ✅ **Free** - No database hosting cost
- ⚠️ **Per-device** - Data doesn't sync between devices
- ⚠️ **Browser storage** - Cleared if user clears browser data

### First Time Setup

When a user first opens the app:
1. IndexedDB is initialized automatically
2. Default data is seeded (franchises, services, admin user)
3. User can start creating orders immediately

---

## Optional: Add AWS Backend (Free Tier)

If you need data sync between devices, add these AWS services:

### Option A: DynamoDB (Recommended for NoSQL)

```
AWS DynamoDB Free Tier:
- 25 GB storage
- 25 read/write capacity units
- 2.5 million read requests/month
- 1 million write requests/month
```

### Option B: AWS Cognito (For User Auth)

```
AWS Cognito Free Tier:
- 50,000 monthly active users
- Sign up, sign in, access control
```

### Option C: AWS Lambda + API Gateway

```
AWS Lambda Free Tier:
- 1 million requests/month
- 400,000 GB-seconds compute
```

---

## Troubleshooting

### Build Fails

1. Check `amplify.yml` is in the root directory
2. Ensure Node.js version is compatible (18+)
3. Check for npm install errors in build logs

### Blank Page After Deploy

1. Verify `dist/index.html` exists in build artifacts
2. Check browser console for JavaScript errors
3. Ensure SPA routing is configured (customRules in amplify.yml)

### Login Doesn't Work

1. Clear browser localStorage: `localStorage.clear()`
2. Refresh the page to reinitialize the database
3. Use correct credentials (see table above)

---

## Custom Domain Setup (Optional)

1. Go to **App settings** → **Domain management**
2. Click **Add domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate to provision (up to 48 hours)

---

## Updating the App

Simply push to your GitHub repository:

```bash
git add .
git commit -m "Update features"
git push
```

Amplify automatically rebuilds and deploys on every push!

---

## Support

For issues:
1. Check Amplify build logs
2. Check browser developer console
3. Verify environment variables are set

---

## Summary

✅ **Free hosting** on AWS Amplify  
✅ **No Supabase required** - Uses browser IndexedDB  
✅ **Works offline** - All data stored locally  
✅ **Auto-deployments** from GitHub  
✅ **HTTPS included** - Secure by default  
✅ **Global CDN** - Fast worldwide access  
