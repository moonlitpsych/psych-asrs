# Vercel Environment Variables Setup

## Critical Issue Fix: Update NEXT_PUBLIC_APP_URL

The application is currently sending questionnaire links with `localhost:3000` instead of the production URL. This needs to be fixed immediately in Vercel.

### Quick Fix Instructions

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your `psych-asrs-one` project

2. **Update Environment Variables**
   - Click on "Settings" tab
   - Select "Environment Variables" from the left sidebar
   - Find `NEXT_PUBLIC_APP_URL` (or add it if missing)
   - Set the value to: `https://psych-asrs-one.vercel.app`
   - Make sure it's enabled for Production environment

3. **Redeploy**
   - Go to the "Deployments" tab
   - Click on the three dots (...) next to your latest deployment
   - Select "Redeploy"
   - Click "Redeploy" in the confirmation dialog

### Complete Environment Variables List

Your Vercel project should have ALL of these environment variables set:

```env
# Supabase (all three are required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Resend (for email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender@domain.com

# Dashboard
NEXT_PUBLIC_DASHBOARD_PASSWORD=your_secure_password

# Application URL (THIS IS THE ONE THAT NEEDS FIXING!)
NEXT_PUBLIC_APP_URL=https://psych-asrs-one.vercel.app

# Optional
SESSION_EXPIRY_HOURS=48
```

### Verification

After redeployment:
1. Send a test questionnaire to yourself
2. Check the email - the link should now show `https://psych-asrs-one.vercel.app/questionnaire/[id]`
3. Click the link to ensure it works properly

### Future Deployments

Remember: Environment variables in Vercel persist across deployments. Once you set them correctly, they'll stay configured for all future deployments.

### Local Development

Your `.env.local` file should keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local testing. The Vercel environment variables override these in production.

---
*Last updated: November 2024*