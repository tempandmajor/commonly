
# Deployment Checklist

This checklist ensures your application is ready for production deployment.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Configuration

#### Required Variables (Critical)
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- [ ] `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

#### Recommended Variables
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (for payments)
- [ ] `VITE_APP_URL` - Your application URL
- [ ] `VITE_BASE_URL` - Your base URL
- [ ] `VITE_API_URL` - Your API URL

#### Optional Variables (Feature-specific)
- [ ] `VITE_GOOGLE_API_KEY` - For maps and location services
- [ ] `VITE_LIVEKIT_URL` - For live events and podcast recording features
- [ ] `VITE_LIVEKIT_API_KEY` - LiveKit API credentials
- [ ] `VITE_LIVEKIT_API_SECRET` - LiveKit API secret
- [ ] `VITE_CLOUDINARY_*` - For image upload and processing

#### Security Check
- [ ] ❌ NO `VITE_STRIPE_SECRET_KEY` in environment files
- [ ] ❌ NO `VITE_SUPABASE_SERVICE_ROLE_KEY` in environment files
- [ ] ❌ NO other secret keys in frontend environment

### 2. Platform-Specific Setup

#### For Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables from your `.env.production` file
4. Set `NODE_ENV=production`

#### For Netlify Deployment
1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add all required environment variables from your `.env.production` file
4. Set `NODE_ENV=production`

### 3. Build Verification
- [ ] Run `npm run build` locally to ensure it builds successfully
- [ ] Run `npm run preview` to test the production build locally
- [ ] Check console for any environment variable warnings

### 4. Supabase Configuration
- [ ] Database tables are properly configured
- [ ] Row Level Security (RLS) policies are in place
- [ ] Storage buckets are configured if needed
- [ ] Edge functions are deployed if used

### 5. External Services
- [ ] Stripe account is set up (if using payments)
- [ ] API keys are valid and not expired
- [ ] Third-party service quotas are sufficient

## 🚀 Deployment Steps

1. **Push to Repository**
   ```bash
   git add .
   git commit -m "Deploy: Environment configuration and security fixes"
   git push origin main
   ```

2. **Configure Platform Environment Variables**
   - Copy variables from `.env.production`
   - Ensure all required variables are set
   - Double-check no secret keys are included

3. **Deploy**
   - Platform will automatically build and deploy
   - Monitor build logs for any errors
   - Check deployed site functionality

4. **Post-Deployment Verification**
   - [ ] Site loads correctly
   - [ ] Authentication works
   - [ ] Database connections work
   - [ ] Payment processing works (if applicable)
   - [ ] No console errors

## 🔧 Troubleshooting

### Common Issues

**Build Fails with "Missing environment variable"**
- Check all required variables are set in deployment platform
- Ensure variable names match exactly (case-sensitive)

**Site loads but features don't work**
- Check browser console for API errors
- Verify Supabase URL and keys are correct
- Check if Row Level Security is blocking requests

**Payment features not working**
- Verify Stripe publishable key is set
- Check if using correct keys (test vs production)
- Ensure Stripe webhooks are configured

**"Unauthorized" or "Forbidden" errors**
- Check Supabase RLS policies
- Verify user authentication is working
- Check API endpoint permissions

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Review deployment platform build logs
3. Verify all environment variables are correctly set
4. Ensure your Supabase project is properly configured
