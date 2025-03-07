/*
  # Update Schema for New Requirements

  1. New Tables
    - `clients`: Client management
    - `documents`: Document storage
    - `recruitment_links`: Recruitment process
  
  2. Updates
    - Add new columns to existing tables
    - Add security policies
    - Create functions and triggers
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  contact_name text,
  contact_email text,
  contact_phone text,
  business_hours text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  max_audits_per_month integer DEFAULT 4,
  requires_special_training boolean DEFAULT false,
  last_audit_date timestamptz
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  client_id uuid REFERENCES clients(id),
  audit_id uuid REFERENCES audits(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  category text NOT NULL
);

-- Create recruitment_links table
CREATE TABLE IF NOT EXISTS recruitment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  completed_at timestamptz,
  profile_id uuid REFERENCES profiles(id)
);

-- Add new columns to audits table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audits' AND column_name = 'client_id') THEN
    ALTER TABLE audits ADD COLUMN client_id uuid REFERENCES clients(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audits' AND column_name = 'requirements') THEN
    ALTER TABLE audits ADD COLUMN requirements text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audits' AND column_name = 'special_instructions') THEN
    ALTER TABLE audits ADD COLUMN special_instructions text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audits' AND column_name = 'notification_sent_at') THEN
    ALTER TABLE audits ADD COLUMN notification_sent_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audits' AND column_name = 'reminder_sent_at') THEN
    ALTER TABLE audits ADD COLUMN reminder_sent_at timestamptz;
  END IF;
END $$;

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'available_hours') THEN
    ALTER TABLE profiles ADD COLUMN available_hours jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_locations') THEN
    ALTER TABLE profiles ADD COLUMN preferred_locations jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'training_completed') THEN
    ALTER TABLE profiles ADD COLUMN training_completed jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    ALTER TABLE profiles ADD COLUMN last_activity timestamptz;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can do all on clients" ON clients;
  DROP POLICY IF EXISTS "Auditors can view active clients" ON clients;
  DROP POLICY IF EXISTS "Admins can do all on documents" ON documents;
  DROP POLICY IF EXISTS "Users can view their own documents and public documents" ON documents;
  DROP POLICY IF EXISTS "Admins can manage recruitment links" ON recruitment_links;
END $$;

-- Create policies
CREATE POLICY "Admins can do all on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Auditors can view active clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    (is_active = true) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'auditor'
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Admins can do all on documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own documents and public documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = documents.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage recruitment links"
  ON recruitment_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_documents_audit_id ON documents(audit_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_links_email ON recruitment_links(email);
CREATE INDEX IF NOT EXISTS idx_recruitment_links_token ON recruitment_links(token);

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS update_client_last_audit_date_trigger ON audits;
DROP FUNCTION IF EXISTS update_client_last_audit_date();
DROP TRIGGER IF EXISTS check_client_audit_limits_trigger ON audits;
DROP FUNCTION IF EXISTS check_client_audit_limits();

-- Create function to update client last_audit_date
CREATE FUNCTION update_client_last_audit_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE clients
    SET last_audit_date = NEW.completed_at
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating client last_audit_date
CREATE TRIGGER update_client_last_audit_date_trigger
  AFTER UPDATE OF status ON audits
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_client_last_audit_date();

-- Create function to check client audit limits
CREATE FUNCTION check_client_audit_limits()
RETURNS TRIGGER AS $$
DECLARE
  monthly_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO monthly_count
  FROM audits
  WHERE client_id = NEW.client_id
  AND scheduled_date >= date_trunc('month', NEW.scheduled_date)
  AND scheduled_date < date_trunc('month', NEW.scheduled_date) + interval '1 month';

  IF monthly_count >= (
    SELECT max_audits_per_month
    FROM clients
    WHERE id = NEW.client_id
  ) THEN
    RAISE EXCEPTION 'Maximum number of audits per month reached for this client';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for checking client audit limits
CREATE TRIGGER check_client_audit_limits_trigger
  BEFORE INSERT ON audits
  FOR EACH ROW
  EXECUTE FUNCTION check_client_audit_limits();