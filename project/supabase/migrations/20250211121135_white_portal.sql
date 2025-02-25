-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for admins and own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for admins" ON profiles;

-- Create simplified policies
CREATE POLICY "Enable all operations for authenticated users"
  ON profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure admin user
UPDATE profiles 
SET role = 'admin', is_active = true 
WHERE email = 'job@gmail.com';