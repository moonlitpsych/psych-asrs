# Supabase Database Setup

## Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Execute the SQL to create all necessary tables and indexes

## Tables Created

- **questionnaire_sessions**: Stores unique session data for each patient questionnaire
- **questionnaire_responses**: Stores individual question responses
- **questionnaire_results**: Stores calculated scores and severity assessments
- **email_logs**: Tracks all email notifications sent
- **sms_logs**: Tracks all SMS messages sent

## Security Features

- Row Level Security (RLS) enabled on all tables for HIPAA compliance
- Automatic session expiration after specified hours
- Indexed columns for optimal query performance

## Environment Variables Needed

After creating the tables, update your `.env.local` file with:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for server-side operations)

You can find these in your Supabase project settings under API.