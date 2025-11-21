# ASRS Assessment Tool - Project Documentation

## Overview
A full-stack web application for administering the Adult ADHD Self-Report Scale (ASRS) Version 1.1. Healthcare providers can send assessment links to patients via email or SMS, patients complete the 18-question assessment, and results are automatically calculated and sent back to the provider. Features IntakeQ EMR integration for seamless clinical workflows.

## Current Status: ✅ PRODUCTION READY
- Assessment workflow complete and tested
- Email AND SMS delivery options
- Dashboard displaying results
- Scoring algorithm implemented
- Moonlit Psychiatry branding applied
- IntakeQ EMR integration in progress

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS 3.4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Deployment**: Vercel-ready

### Database Schema
```sql
-- Main tables (all created and working)
questionnaire_sessions    -- Stores patient sessions
questionnaire_responses    -- Stores individual question responses
questionnaire_results      -- Stores calculated scores and results
```

### Key Features Implemented
1. ✅ Provider can create assessment sessions with patient info
2. ✅ Email OR SMS sent to patient with unique assessment link
3. ✅ Patient completes 18-question ASRS assessment
4. ✅ Automatic score calculation (Part A and Total scores)
5. ✅ Email notifications sent upon completion
6. ✅ Provider dashboard with all assessments and scores
7. ✅ Session expiration after 48 hours
8. ✅ Secure dashboard with password protection
9. ✅ Copy-to-clipboard SMS functionality
10. ✅ Auto-advance questionnaire (no redundant Next button)
11. ✅ Moonlit brand design system
12. 🚧 IntakeQ EMR integration (Phase 1 in progress)

## Important Files

### Core Application Files
- `/app/page.tsx` - Provider form to send assessments
- `/app/questionnaire/[id]/page.tsx` - Patient assessment page
- `/app/dashboard/page.tsx` - Provider dashboard
- `/components/QuestionnaireForm.tsx` - 18-question ASRS form
- `/components/ResultsDisplay.tsx` - Results visualization
- `/lib/scoring.ts` - ASRS scoring algorithm

### API Routes
- `/app/api/send-questionnaire-link/route.ts` - Creates session and sends email
- `/app/api/sessions/[id]/route.ts` - Gets session data
- `/app/api/sessions/[id]/responses/route.ts` - Saves responses
- `/app/api/sessions/[id]/complete/route.ts` - Marks session complete
- `/app/api/notifications/email/route.ts` - Sends completion emails
- `/app/api/dashboard/sessions/route.ts` - Dashboard data endpoint

## Environment Variables Required
```env
# Supabase - CRITICAL: Use new format keys (sb_secret_/sb_publishable_)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Resend (Email)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Dashboard
NEXT_PUBLIC_DASHBOARD_PASSWORD=your_dashboard_password

# App URL (IMPORTANT: Update for production!)
NEXT_PUBLIC_APP_URL=https://psych-asrs-one.vercel.app

# IntakeQ Integration (Phase 1)
INTAKEQ_API_KEY=your_intakeq_api_key
INTAKEQ_API_URL=https://intakeq.com/api/v1
INTAKEQ_PRACTITIONER_ID=your_practitioner_id

# Optional - SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid  # Future enhancement
TWILIO_AUTH_TOKEN=your_auth_token    # Future enhancement
TWILIO_PHONE_NUMBER=+1234567890      # Future enhancement
```

## Known Issues & Solutions

### Issue 1: Database Permissions
**Problem**: Permission denied errors when accessing tables
**Solution**: Grant permissions to authenticated, anon, and service_role roles:
```sql
GRANT ALL ON questionnaire_sessions TO authenticated, anon, service_role;
GRANT ALL ON questionnaire_responses TO authenticated, anon, service_role;
GRANT ALL ON questionnaire_results TO authenticated, anon, service_role;
```

### Issue 2: Dashboard Not Loading
**Problem**: Client-side Supabase queries failing with empty errors
**Solution**: Dashboard now uses server-side API endpoint (`/api/dashboard/sessions`)

### Issue 3: New Supabase API Keys
**Problem**: New Supabase projects use `sb_secret_` and `sb_publishable_` prefix instead of JWT format
**Solution**: Use the new format keys exactly as provided by Supabase

### Issue 4: Vercel Deployment TypeScript Error
**Problem**: Build fails with "Type 'undefined' is not assignable to type 'string'" in lib/supabase.ts:29
**Solution**: Already fixed in commit 66db284 - added non-null assertion (!) to process.env.NEXT_PUBLIC_SUPABASE_URL
**Note**: If Vercel deploys an older commit, manually trigger redeploy from Vercel dashboard

### Issue 5: Security - Hardcoded Admin Password (FIXED)
**Problem**: Dashboard had fallback password 'admin' hardcoded
**Solution**: Removed in commit 66db284 - now only accepts environment variable password

## Testing Workflow
1. Go to http://localhost:3000
2. Enter patient details and clinician email
3. Check patient email for assessment link
4. Complete all 18 questions
5. View results page
6. Check clinician email for results notification
7. Login to dashboard (password in env)
8. View completed assessment with scores

## Recent Updates (November 2024)

### ✅ Completed Enhancements
1. **SMS/Text Support**: Send assessment links via text message with copy-to-clipboard
2. **Moonlit Branding**: Applied coral/navy/cream color scheme matching Moonlit Psychiatry
3. **UX Improvements**: Removed redundant Next button, auto-advance after selection
4. **Production Deployment**: Successfully deployed on Vercel with proper URL configuration

### 🚧 In Progress: IntakeQ Integration
- **Phase 1**: Submit ASRS results to IntakeQ as treatment notes
- **Phase 2**: Webhook automation for triggered assessments
- **Phase 3**: Full bi-directional patient data sync

## Scoring Algorithm
- **Part A**: First 6 questions, threshold 4+ for positive screening
- **Total Score**: All 18 questions, max 72 points
- **Severity Levels**:
  - 0-16: None/Minimal
  - 17-23: Mild
  - 24-35: Moderate
  - 36+: Severe

## Next Steps for Future Development
- Add user authentication for providers
- Implement patient history tracking
- Add PDF export for results
- Create admin panel for managing providers
- Add more assessment types beyond ASRS
- Implement data analytics dashboard

## Deployment Notes
1. Set all environment variables in Vercel
2. Ensure Supabase tables have proper permissions
3. Configure Resend domain for production emails
4. Update NEXT_PUBLIC_APP_URL to production domain

## Support
For issues or questions about this codebase, refer to:
- This documentation
- Comments in code files
- Supabase and Resend documentation