# Netlify Deployment Guide

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: Set up in Netlify dashboard

## Deployment Steps

### 1. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your repository: `FabZClean-T1`
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 2. Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

```
VITE_STACK_PROJECT_ID=4ed40039-6db7-498b-a4ff-844327ee0229
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_2rzy4m97drzcptv5zzsef6dfa1rvtccqxjpn8xgyt99er
STACK_SECRET_SERVER_KEY=ssk_3tk7eekem9hmnddswsbtvfkw3z5p7t2q589qrrdggftbg
DATABASE_URL=postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NEON_REST_API_URL=https://ep-frosty-sun-a1pdxel5.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1
JWKS_URL=https://api.stack-auth.com/api/v1/projects/4ed40039-6db7-498b-a4ff-844327ee0229/.well-known/jwks.json
```

### 3. Deploy

1. Click "Deploy site"
2. Netlify will automatically build and deploy your app
3. Your app will be available at `https://your-site-name.netlify.app`

## ✅ Ready for Deployment!

Your app is now configured for Netlify hosting with:
- ✅ Static site build (React app)
- ✅ Serverless functions for API endpoints
- ✅ Environment variables configured
- ✅ CORS headers set up
- ✅ SPA routing configured

## API Endpoints

Your API will be available at:
- `https://your-site-name.netlify.app/api/orders`
- `https://your-site-name.netlify.app/api/customers`
- `https://your-site-name.netlify.app/api/products`
- `https://your-site-name.netlify.app/api/services`
- `https://your-site-name.netlify.app/api/deliveries`
- `https://your-site-name.netlify.app/api/dashboard/metrics`
- `https://your-site-name.netlify.app/api/health/database`
- `https://your-site-name.netlify.app/api/database/info`

## Local Development with Netlify

To test locally with Netlify functions:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start local development server
npm run netlify:dev
```

This will start your app at `http://localhost:8888` with serverless functions.

## Build Process

The build process:
1. **Client Build**: `vite build` - Builds React app to `dist/`
2. **Functions Build**: `tsc --project tsconfig.functions.json` - Compiles TypeScript functions
3. **Deploy**: Netlify deploys both static files and serverless functions

## Troubleshooting

### Common Issues

1. **Build Failures**: Check environment variables are set correctly
2. **Function Errors**: Check Netlify function logs in dashboard
3. **Database Connection**: Ensure DATABASE_URL is correct
4. **CORS Issues**: Functions include CORS headers automatically

### Debugging

1. Check build logs in Netlify dashboard
2. Check function logs in Netlify dashboard → Functions
3. Test API endpoints directly in browser or Postman

## Custom Domain (Optional)

1. Go to Site Settings → Domain Management
2. Add your custom domain
3. Configure DNS settings as instructed
4. Enable HTTPS (automatic with Netlify)

## Performance Optimization

- Static assets are cached automatically
- Functions have cold start delays (consider caching)
- Use CDN for better global performance
- Optimize images and assets

## Security

- Environment variables are secure in Netlify
- HTTPS is enabled by default
- CORS is configured for API endpoints
- Database credentials are protected

## Monitoring

- Check Netlify Analytics for usage stats
- Monitor function execution in dashboard
- Set up alerts for build failures
- Monitor database performance in Neon dashboard
