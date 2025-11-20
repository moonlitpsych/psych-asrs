# ASRS Assessment Platform

A HIPAA-compliant web application for administering the Adult ADHD Self-Report Scale (ASRS) questionnaire. Patients receive assessment links via SMS, complete the questionnaire online, and results are automatically sent to healthcare providers.

## Features

- **Patient Assessment Portal**: Mobile-friendly questionnaire interface with one-question-at-a-time flow
- **SMS Integration**: Send unique assessment links to patients via text message
- **Automated Scoring**: Calculates Part A screening score and total severity based on ASRS 1.1 guidelines
- **Email Notifications**: Automatic notifications to clinicians when assessments are completed
- **Provider Dashboard**: View all patient assessments, track completion status, export data
- **HIPAA Compliance**: Security headers, encrypted data transmission, audit logging
- **Session Management**: Automatic expiration of assessment links after 48 hours

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **SMS**: Twilio
- **Email**: Resend
- **Hosting**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Twilio account (for SMS)
- Resend account (for email)
- Vercel account (for deployment)

### 2. Clone and Install

```bash
git clone [your-repo-url]
cd psych-asrs
npm install
```

### 3. Configure Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the SQL from `supabase/migrations/001_initial_schema.sql`
4. This creates all necessary tables with Row Level Security enabled

### 4. Set Environment Variables

Copy `.env.example` to `.env.local` and update with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=[your-account-sid]
TWILIO_AUTH_TOKEN=[your-auth-token]
TWILIO_PHONE_NUMBER=[your-twilio-phone-number]

# Resend (for Email)
RESEND_API_KEY=[your-resend-api-key]
RESEND_FROM_EMAIL=notifications@[your-domain].com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production
CLINICIAN_EMAIL=[your-email@example.com]
DASHBOARD_PASSWORD=[secure-password]

# Security
SESSION_EXPIRY_HOURS=48
JWT_SECRET=[generate-secure-random-string]
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (copy from `.env.local`)
5. Click "Deploy"

### 3. Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Usage Guide

### Sending Assessment Links

1. Go to the home page
2. Click "Send New Assessment"
3. Fill in patient information
4. Click "Send Assessment Link via SMS"
5. Patient receives text with unique link

### Patient Experience

1. Patient clicks link in SMS
2. Enters assessment portal
3. Answers 18 questions (auto-saves progress)
4. Views results immediately
5. Can download or print results

### Provider Dashboard

1. Navigate to `/dashboard`
2. Enter dashboard password
3. View all assessments with status
4. Filter by status or search by patient
5. Export data as CSV

## API Endpoints

- `POST /api/sessions/create` - Create new assessment session
- `GET /api/sessions/[id]` - Get session details
- `POST /api/sessions/[id]/responses` - Save question responses
- `POST /api/sessions/[id]/complete` - Complete assessment and calculate scores
- `POST /api/send-questionnaire-link` - Send SMS with assessment link
- `POST /api/notifications/email` - Send email notifications

## Security Features

- **Data Encryption**: All data encrypted at rest (Supabase) and in transit (HTTPS)
- **Session Expiry**: Assessment links expire after 48 hours
- **Security Headers**: X-Frame-Options, CSP, HSTS implemented
- **Row Level Security**: Database-level security policies
- **Audit Logging**: All access logged for compliance
- **Password Protection**: Dashboard requires authentication

## HIPAA Compliance Considerations

This application includes HIPAA-compliant security features, but full compliance requires:

1. **Business Associate Agreement (BAA)** with:
   - Supabase (available on Pro plan)
   - Twilio (available with Healthcare eligibility)
   - Resend or your email provider
   - Vercel (Enterprise plan)

2. **Additional Security Measures**:
   - Enable 2FA on all service accounts
   - Regular security audits
   - Employee training on PHI handling
   - Incident response plan
   - Data backup and recovery procedures

3. **Access Controls**:
   - Implement role-based access control
   - Regular access reviews
   - Audit logging to SIEM system

## Troubleshooting

### SMS Not Sending
- Verify Twilio credentials in environment variables
- Check Twilio account balance
- Ensure phone number is in E.164 format
- Check Twilio console for error logs

### Email Not Sending
- Verify Resend API key
- Check sender email is verified in Resend
- Review email logs in Supabase database

### Database Connection Issues
- Verify Supabase URL and keys
- Check Row Level Security policies
- Ensure tables are created from migration file

### Session Expired Errors
- Check SESSION_EXPIRY_HOURS setting
- Verify system time is correct
- Run database cleanup for expired sessions

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs for database errors
3. Check browser console for client-side errors
4. Review server logs in Vercel dashboard

## License

Private healthcare application. All rights reserved.

## Acknowledgments

Built with the Adult ADHD Self-Report Scale (ASRS-v1.1) from the WHO Composite International Diagnostic Interview.