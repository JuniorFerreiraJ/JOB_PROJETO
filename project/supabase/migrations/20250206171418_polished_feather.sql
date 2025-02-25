-- Add follow_up_date column to audit_reports table
ALTER TABLE audit_reports
ADD COLUMN IF NOT EXISTS follow_up_date date;

-- Add recommendations column if it doesn't exist
ALTER TABLE audit_reports
ADD COLUMN IF NOT EXISTS recommendations text;

-- Add risk_level column if it doesn't exist
ALTER TABLE audit_reports
ADD COLUMN IF NOT EXISTS risk_level text;

-- Add checklist_data column if it doesn't exist
ALTER TABLE audit_reports
ADD COLUMN IF NOT EXISTS checklist_data jsonb;

-- Add photos column if it doesn't exist
ALTER TABLE audit_reports
ADD COLUMN IF NOT EXISTS photos jsonb;