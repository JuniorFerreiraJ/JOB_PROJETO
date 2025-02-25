/*
  # Update authentication policies

  1. Changes
    - Remove existing audit policies
    - Create new simplified policies for authenticated users
    - No user/profile creation (handled by previous migrations)
*/

-- Remove todas as políticas existentes para garantir um estado limpo
DROP POLICY IF EXISTS "Users can create audits" ON audits;
DROP POLICY IF EXISTS "Users can view all audits" ON audits;
DROP POLICY IF EXISTS "Users can update audits" ON audits;

-- Redefine as políticas de forma mais simples
CREATE POLICY "Enable read for authenticated users"
  ON audits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON audits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'auditor' OR profiles.role = 'admin')
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Enable update for authenticated users"
  ON audits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'auditor' AND audits.auditor_id = auth.uid())
        OR profiles.role = 'admin'
      )
      AND profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.role = 'auditor' AND audits.auditor_id = auth.uid())
        OR profiles.role = 'admin'
      )
      AND profiles.is_active = true
    )
  );