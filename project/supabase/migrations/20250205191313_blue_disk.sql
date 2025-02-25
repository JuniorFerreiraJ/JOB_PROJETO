/*
  # Implementação de regras RLS para o sistema de auditoria

  1. Changes
    - Remove políticas existentes
    - Implementa novas políticas baseadas em roles
    - Configura regras específicas para admins e auditores
    
  2. Security
    - Admins têm acesso total a todas as tabelas
    - Auditores podem ver todas as auditorias
    - Auditores só podem criar/editar relatórios das suas próprias auditorias
    - Auditores só podem ver seus próprios relatórios
*/

-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Allow select for all" ON audits;
DROP POLICY IF EXISTS "Allow insert for all" ON audits;
DROP POLICY IF EXISTS "Allow update for all" ON audits;
DROP POLICY IF EXISTS "Allow delete for all" ON audits;

DROP POLICY IF EXISTS "Allow select for all" ON audit_reports;
DROP POLICY IF EXISTS "Allow insert for all" ON audit_reports;
DROP POLICY IF EXISTS "Allow update for all" ON audit_reports;
DROP POLICY IF EXISTS "Allow delete for all" ON audit_reports;

-- Políticas para audits

-- Admins podem fazer tudo
CREATE POLICY "Admins have full access to audits"
  ON audits
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

-- Auditores podem ver todas as auditorias
CREATE POLICY "Auditors can view all audits"
  ON audits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'auditor'
    )
  );

-- Auditores podem atualizar suas próprias auditorias
CREATE POLICY "Auditors can update assigned audits"
  ON audits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'auditor'
      AND audits.auditor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'auditor'
      AND audits.auditor_id = auth.uid()
    )
  );

-- Políticas para audit_reports

-- Admins podem fazer tudo com relatórios
CREATE POLICY "Admins have full access to reports"
  ON audit_reports
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

-- Auditores podem ver seus próprios relatórios
CREATE POLICY "Auditors can view own reports"
  ON audit_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_reports.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );

-- Auditores podem criar relatórios para suas auditorias
CREATE POLICY "Auditors can create reports for assigned audits"
  ON audit_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_reports.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );

-- Auditores podem atualizar seus próprios relatórios
CREATE POLICY "Auditors can update own reports"
  ON audit_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_reports.audit_id
      AND audits.auditor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_reports.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );