-- Add questionnaire types support
-- Run this in Supabase SQL editor after the initial schema

-- Create questionnaire types table
CREATE TABLE IF NOT EXISTS questionnaire_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_questions INTEGER NOT NULL,
  scoring_type VARCHAR(50) DEFAULT 'standard',
  max_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default questionnaire types
INSERT INTO questionnaire_types (code, name, description, total_questions, scoring_type, max_score) VALUES
('ASRS', 'Adult ADHD Self-Report Scale', 'ASRS Version 1.1 - Screens for adult ADHD symptoms', 18, 'asrs', 72),
('PHQ9', 'Patient Health Questionnaire-9', 'Screens for depression severity', 9, 'standard', 27),
('GAD7', 'Generalized Anxiety Disorder-7', 'Screens for anxiety severity', 7, 'standard', 21);

-- Add questionnaire_type column to existing tables
ALTER TABLE questionnaire_sessions 
ADD COLUMN IF NOT EXISTS questionnaire_type VARCHAR(50) DEFAULT 'ASRS';

-- Add foreign key reference
ALTER TABLE questionnaire_sessions 
ADD CONSTRAINT fk_questionnaire_type 
FOREIGN KEY (questionnaire_type) 
REFERENCES questionnaire_types(code);

-- Make results table more flexible
ALTER TABLE questionnaire_results 
ADD COLUMN IF NOT EXISTS questionnaire_type VARCHAR(50) DEFAULT 'ASRS',
ADD COLUMN IF NOT EXISTS scores JSONB;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_questionnaire_type ON questionnaire_sessions(questionnaire_type);

-- Grant permissions
GRANT ALL ON questionnaire_types TO authenticated, anon, service_role;