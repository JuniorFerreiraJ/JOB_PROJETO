/*
  # Initial Schema for Audit Management System

  1. New Tables
    - `profiles`
      - User profiles for both admins and auditors
      - Stores name, phone, email, and role
    - `audits`
      - Stores audit assignments and details
      - Links to auditor profile
      - Includes status and scheduling info
    - `audit_reports`
      - Stores audit reports and attachments
      - Links to audit and auditor
    - `audit_photos`
      - Stores photo requirements for audits
      - Links to audit reports
    
  2. Security
    - Enable RLS on all tables
    - Policies for admin and auditor access
    - Secure file storage access
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'auditor');

-- Create enum for audit status
CREATE TYPE audit_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'auditor',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audits table
CREATE TABLE audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  auditor_id uuid REFERENCES profiles(id),
  scheduled_date timestamptz NOT NULL,
  status audit_status DEFAULT 'pending',
  location text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit reports table
CREATE TABLE audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  receipt_url text,
  checklist_data jsonb,
  notes text,
  reimbursement_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit photos table
CREATE TABLE audit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES audit_reports(id) NOT NULL,
  photo_type text NOT NULL,
  photo_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Audits policies
CREATE POLICY "Admins can do all on audits"
  ON audits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Auditors can view assigned audits"
  ON audits FOR SELECT
  USING (
    auditor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Reports policies
CREATE POLICY "Admins can do all on reports"
  ON audit_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Auditors can manage their reports"
  ON audit_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_reports.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );

-- Photos policies
CREATE POLICY "Admins can do all on photos"
  ON audit_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Auditors can manage their photos"
  ON audit_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM audit_reports
      JOIN audits ON audits.id = audit_reports.audit_id
      WHERE audit_reports.id = audit_photos.report_id
      AND audits.auditor_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION check_auditor_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM audits
    WHERE auditor_id = NEW.auditor_id
    AND status IN ('pending', 'confirmed')
  ) >= 3 THEN
    RAISE EXCEPTION 'Auditor already has 3 active audits';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check auditor limit
CREATE TRIGGER check_auditor_limit_trigger
  BEFORE INSERT OR UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION check_auditor_limit();