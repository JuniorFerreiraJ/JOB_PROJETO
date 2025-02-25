-- Drop previous function attempts
DROP FUNCTION IF EXISTS create_auditor_secure;
DROP FUNCTION IF EXISTS create_new_auditor;

-- Update profiles policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for admins" ON profiles;
DROP POLICY IF EXISTS "Enable update for admins and own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for admins" ON profiles;

-- Create new simplified policies
CREATE POLICY "Enable read for all authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

CREATE POLICY "Enable update for admins and own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

CREATE POLICY "Enable delete for admins"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );