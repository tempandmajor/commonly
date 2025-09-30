# Supabase Setup Instructions

This project has been converted to Next.js and is ready to connect to your existing Supabase account from your iPhone app.

## Quick Setup Steps

### 1. Update Environment Variables

Replace the placeholder values in `.env` with your actual Supabase credentials:

```bash
# Update these with your actual Supabase project details
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id-here
```

### 2. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your existing project (the one used by your iPhone app)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project Reference ID** (from URL) → `NEXT_PUBLIC_SUPABASE_PROJECT_ID`

### 3. Update Production Environment

Update `.env.production` with your production Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anonymous-key
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
```

### 4. Configure Other Services (Optional)

Update other service configurations as needed:

```bash
# Application URLs
NEXT_PUBLIC_API_URL=your_api_url_here
NEXT_PUBLIC_BASE_URL=your_base_url_here
NEXT_PUBLIC_APP_URL=your_app_url_here

# Google Services (if needed)
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key_here

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_PRESET=your_cloudinary_preset
NEXT_PUBLIC_CLOUDINARY_NAME=your_cloudinary_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key

# LiveKit (for live streaming)
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
NEXT_PUBLIC_LIVEKIT_API_KEY=your_livekit_api_key
NEXT_PUBLIC_LIVEKIT_API_SECRET=your_livekit_secret
```

## What's Been Removed

✅ **Vite** - All Vite configurations and dependencies removed
✅ **Firebase** - No Firebase references found (already clean)
✅ **Stripe** - All Stripe integrations and keys removed
✅ **Sensitive Keys** - All hardcoded API keys removed

## What's Ready

✅ **Next.js App Router** - Modern Next.js 15 structure
✅ **Supabase Integration** - Ready to connect to your existing database
✅ **Environment Configuration** - Centralized config with validation
✅ **TypeScript** - Fully typed with database types

## Database Compatibility

This web app should work seamlessly with your existing iPhone app's Supabase database since it uses the same:
- Database schema
- Authentication system
- Row Level Security policies
- API endpoints

## Next Steps

1. Update the environment variables as shown above
2. Run `npm install` to ensure all dependencies are installed
3. Run `npm run dev` to start the development server
4. Test the connection by checking if data from your iPhone app appears

## Troubleshooting

If you encounter issues:
1. Check that your Supabase URL and keys are correct
2. Verify your database policies allow web access
3. Check the browser console for any CORS or authentication errors
4. Ensure your Supabase project has the same authentication providers enabled

The project is now clean of all third-party payment integrations and ready to use your existing Supabase infrastructure.