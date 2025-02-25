-- Remove políticas existentes para audits
DROP POLICY IF EXISTS "Auditors can create audits" ON audits;
DROP POLICY IF EXISTS "Admins have full access to audits" ON audits;
DROP POLICY IF EXISTS "Auditors can view all audits" ON audits;
DROP POLICY IF EXISTS "Auditors can update assigned audits" ON audits;

-- Política para permitir que auditores e admins criem auditorias
CREATE POLICY "Users can create audits"
  ON audits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'auditor' OR profiles.role = 'admin')
      AND profiles.is_active = true
    )
  );

-- Política para permitir que todos os usuários autenticados vejam todas as auditorias
CREATE POLICY "Users can view all audits"
  ON audits
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir que auditores atualizem suas próprias auditorias e admins atualizem todas
CREATE POLICY "Users can update audits"
  ON audits
  FOR UPDATE
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