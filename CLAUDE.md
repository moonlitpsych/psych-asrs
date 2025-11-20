# ASRS Assessment Tool - Project Documentation

## Overview
A full-stack web application for administering the Adult ADHD Self-Report Scale (ASRS) Version 1.1. Healthcare providers can send assessment links to patients via email, patients complete the 18-question assessment, and results are automatically calculated and sent back to the provider.

## Current Status: ✅ FULLY FUNCTIONAL
- Assessment workflow complete and tested
- Email notifications working
- Dashboard displaying results
- Scoring algorithm implemented

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
2. ✅ Email sent to patient with unique assessment link
3. ✅ Patient completes 18-question ASRS assessment
4. ✅ Automatic score calculation (Part A and Total scores)
5. ✅ Email notifications sent upon completion
6. ✅ Provider dashboard with all assessments and scores
7. ✅ Session expiration after 48 hours
8. ✅ Secure dashboard with password protection

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

# Dashboard
NEXT_PUBLIC_DASHBOARD_PASSWORD=your_dashboard_password

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
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

## Testing Workflow
1. Go to http://localhost:3000
2. Enter patient details and clinician email
3. Check patient email for assessment link
4. Complete all 18 questions
5. View results page
6. Check clinician email for results notification
7. Login to dashboard (password in env)
8. View completed assessment with scores

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