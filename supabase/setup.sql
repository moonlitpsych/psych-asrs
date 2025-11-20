-- ASRS Assessment Tool Database Setup
-- Run this file in your Supabase SQL editor to set up the database

-- Grant permissions to all tables for the application to work
GRANT ALL ON questionnaire_sessions TO authenticated, anon, service_role;
GRANT ALL ON questionnaire_responses TO authenticated, anon, service_role;
GRANT ALL ON questionnaire_results TO authenticated, anon, service_role;

-- Also grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- Note: Tables should already exist from Supabase migrations
-- If you need to disable RLS temporarily for testing:
-- ALTER TABLE questionnaire_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE questionnaire_responses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE questionnaire_results DISABLE ROW LEVEL SECURITY;
