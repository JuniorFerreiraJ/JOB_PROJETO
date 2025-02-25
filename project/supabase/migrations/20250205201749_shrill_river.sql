-- Adiciona novos campos na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS employee_id text,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS certifications text,
ADD COLUMN IF NOT EXISTS specialties text,
ADD COLUMN IF NOT EXISTS notes text;

-- Atualiza as políticas de segurança
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );