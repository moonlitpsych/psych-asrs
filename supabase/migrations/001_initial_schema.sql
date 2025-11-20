-- Create questionnaire_sessions table
CREATE TABLE IF NOT EXISTS questionnaire_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unique_id VARCHAR(10) UNIQUE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_dob DATE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
    clinician_email VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create questionnaire_responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 18),
    question_text TEXT NOT NULL,
    response_value INTEGER NOT NULL CHECK (response_value >= 0 AND response_value <= 4),
    response_text VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(session_id, question_number)
);

-- Create questionnaire_results table
CREATE TABLE IF NOT EXISTS questionnaire_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID UNIQUE NOT NULL REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
    part_a_score INTEGER NOT NULL,
    part_a_positive BOOLEAN NOT NULL,
    total_score INTEGER NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minimal', 'mild', 'moderate', 'severe')),
    clinician_notified BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create email_logs table for tracking notifications
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES questionnaire_sessions(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    subject TEXT,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create sms_logs table for tracking SMS messages
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES questionnaire_sessions(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_unique_id ON questionnaire_sessions(unique_id);
CREATE INDEX idx_sessions_status ON questionnaire_sessions(status);
CREATE INDEX idx_sessions_clinician_email ON questionnaire_sessions(clinician_email);
CREATE INDEX idx_sessions_expires_at ON questionnaire_sessions(expires_at);
CREATE INDEX idx_responses_session_id ON questionnaire_responses(session_id);
CREATE INDEX idx_results_session_id ON questionnaire_results(session_id);
CREATE INDEX idx_email_logs_session_id ON email_logs(session_id);
CREATE INDEX idx_sms_logs_session_id ON sms_logs(session_id);

-- Create a view for easy access to complete session data
CREATE OR REPLACE VIEW session_summary AS
SELECT
    s.id,
    s.unique_id,
    s.patient_name,
    s.patient_email,
    s.patient_dob,
    s.phone_number,
    s.status,
    s.created_at,
    s.started_at,
    s.completed_at,
    s.expires_at,
    s.clinician_email,
    r.part_a_score,
    r.part_a_positive,
    r.total_score,
    r.severity,
    r.clinician_notified,
    COUNT(DISTINCT resp.id) as responses_count
FROM questionnaire_sessions s
LEFT JOIN questionnaire_results r ON s.id = r.session_id
LEFT JOIN questionnaire_responses resp ON s.id = resp.session_id
GROUP BY
    s.id, s.unique_id, s.patient_name, s.patient_email, s.patient_dob,
    s.phone_number, s.status, s.created_at, s.started_at, s.completed_at,
    s.expires_at, s.clinician_email, r.part_a_score, r.part_a_positive,
    r.total_score, r.severity, r.clinician_notified;

-- Enable Row Level Security (RLS) for HIPAA compliance
ALTER TABLE questionnaire_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Create a function to automatically expire old sessions
CREATE OR REPLACE FUNCTION expire_old_sessions() RETURNS void AS $$
BEGIN
    UPDATE questionnaire_sessions
    SET status = 'expired'
    WHERE status IN ('pending', 'in_progress')
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a session is valid
CREATE OR REPLACE FUNCTION is_session_valid(p_unique_id VARCHAR) RETURNS BOOLEAN AS $$
DECLARE
    v_status VARCHAR;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT status, expires_at INTO v_status, v_expires_at
    FROM questionnaire_sessions
    WHERE unique_id = p_unique_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_status = 'completed' OR v_status = 'expired' THEN
        RETURN FALSE;
    END IF;

    IF v_expires_at < NOW() THEN
        UPDATE questionnaire_sessions
        SET status = 'expired'
        WHERE unique_id = p_unique_id;
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;