/*
  # Correção das políticas RLS para relatórios de auditoria

  1. Changes
    - Remove políticas existentes da tabela audit_reports
    - Cria novas políticas simplificadas para permitir operações básicas
    - Garante acesso público temporário para testes
*/

-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Admins can do all on reports" ON audit_reports;
DROP POLICY IF EXISTS "Auditors can manage their reports" ON audit_reports;

-- Desabilita e reabilita RLS para garantir um estado limpo
ALTER TABLE audit_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT para todos (incluindo anon)
CREATE POLICY "Allow select for all"
  ON audit_reports
  FOR SELECT
  TO public
  USING (true);

-- Política para permitir INSERT para todos (incluindo anon)
CREATE POLICY "Allow insert for all"
  ON audit_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para permitir UPDATE para todos (incluindo anon)
CREATE POLICY "Allow update for all"
  ON audit_reports
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Política para permitir DELETE para todos (incluindo anon)
CREATE POLICY "Allow delete for all"
  ON audit_reports
  FOR DELETE
  TO public
  USING (true);