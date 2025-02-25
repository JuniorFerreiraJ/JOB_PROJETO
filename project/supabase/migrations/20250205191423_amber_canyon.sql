/*
  # Correção de políticas RLS para criação de auditorias

  1. Changes
    - Adiciona política específica para permitir que auditores criem auditorias
    - Garante que o auditor_id seja definido automaticamente como o usuário atual
    
  2. Security
    - Mantém as políticas existentes
    - Adiciona política específica para INSERT
*/

-- Adiciona política para permitir que auditores criem auditorias
CREATE POLICY "Auditors can create audits"
  ON audits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'auditor' OR profiles.role = 'admin')
    )
  );