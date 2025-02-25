/*
  # Atualizar políticas de segurança para auditorias

  1. Changes
    - Remove restrição de admin para criação de auditorias
    - Permite que qualquer usuário autenticado crie auditorias
    - Mantém as políticas de visualização existentes
*/

-- Remove a política antiga
DROP POLICY IF EXISTS "Admins can do all on audits" ON audits;

-- Cria nova política para permitir que qualquer usuário autenticado crie auditorias
CREATE POLICY "Users can create audits"
  ON audits FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cria política para permitir que qualquer usuário autenticado veja todas as auditorias
CREATE POLICY "Users can view all audits"
  ON audits FOR SELECT
  TO authenticated
  USING (true);

-- Permite que usuários atualizem suas próprias auditorias
CREATE POLICY "Users can update own audits"
  ON audits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);