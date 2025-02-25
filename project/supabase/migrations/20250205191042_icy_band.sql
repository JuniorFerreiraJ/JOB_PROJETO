/*
  # Correção final das políticas de autenticação e RLS

  1. Changes
    - Recria todas as políticas do zero
    - Garante que o usuário anônimo tenha acesso básico
    - Simplifica as políticas para permitir operações básicas
*/

-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON audits;
DROP POLICY IF EXISTS "Admins can do all on audits" ON audits;
DROP POLICY IF EXISTS "Auditors can view assigned audits" ON audits;
DROP POLICY IF EXISTS "Users can create audits" ON audits;
DROP POLICY IF EXISTS "Users can view all audits" ON audits;
DROP POLICY IF EXISTS "Users can update own audits" ON audits;

-- Desabilita e reabilita RLS para garantir um estado limpo
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT para todos (incluindo anon)
CREATE POLICY "Allow select for all"
  ON audits
  FOR SELECT
  TO public
  USING (true);

-- Política para permitir INSERT para todos (incluindo anon)
CREATE POLICY "Allow insert for all"
  ON audits
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para permitir UPDATE para todos (incluindo anon)
CREATE POLICY "Allow update for all"
  ON audits
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Política para permitir DELETE para todos (incluindo anon)
CREATE POLICY "Allow delete for all"
  ON audits
  FOR DELETE
  TO public
  USING (true);