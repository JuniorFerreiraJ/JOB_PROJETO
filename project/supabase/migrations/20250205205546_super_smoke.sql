/*
  # Prevent Administrators from Being Auditors

  1. Changes
    - Updates admin role for specific email
    - Removes admin users from auditor assignments
    - Creates function and trigger to prevent admin-auditor conflicts
    - Adds policy to prevent admin assignment as auditors

  2. Security
    - Ensures administrators cannot be assigned as auditors
    - Maintains data integrity by preventing invalid role assignments
*/

-- Garante que o admin principal não seja listado como auditor
UPDATE profiles
SET role = 'admin'
WHERE email = 'job@gmail.com';

-- Remove quaisquer registros de auditoria associados ao admin
UPDATE audits
SET auditor_id = NULL
WHERE auditor_id IN (
  SELECT id FROM profiles WHERE role = 'admin'
);

-- Cria uma função para impedir que admins sejam registrados como auditores
CREATE OR REPLACE FUNCTION prevent_admin_as_auditor()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role = 'admin' AND EXISTS (
    SELECT 1 FROM audits WHERE auditor_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Administradores não podem ser auditores';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria um trigger para impedir que admins sejam registrados como auditores
DROP TRIGGER IF EXISTS prevent_admin_as_auditor_trigger ON profiles;
CREATE TRIGGER prevent_admin_as_auditor_trigger
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_as_auditor();

-- Cria uma política para impedir que admins sejam atribuídos como auditores
CREATE POLICY "Prevent admin assignment as auditor"
  ON audits
  FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = audits.auditor_id
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = audits.auditor_id
      AND profiles.role = 'admin'
    )
  );