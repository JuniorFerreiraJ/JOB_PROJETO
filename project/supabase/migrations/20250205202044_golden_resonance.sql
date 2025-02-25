-- Adiciona novos campos na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS audit_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_audits integer DEFAULT 3;

-- Função para verificar e atualizar o contador de auditorias
CREATE OR REPLACE FUNCTION update_auditor_audit_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o contador de auditorias do auditor
  UPDATE profiles
  SET audit_count = (
    SELECT COUNT(*)
    FROM audits
    WHERE auditor_id = NEW.auditor_id
    AND status IN ('pending', 'confirmed')
  )
  WHERE id = NEW.auditor_id;

  -- Verifica se excedeu o limite
  IF (
    SELECT audit_count >= max_audits
    FROM profiles
    WHERE id = NEW.auditor_id
  ) THEN
    RAISE EXCEPTION 'Auditor já atingiu o limite máximo de auditorias ativas';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger para atualizar o contador
DROP TRIGGER IF EXISTS update_auditor_audit_count_trigger ON audits;
CREATE TRIGGER update_auditor_audit_count_trigger
  AFTER INSERT OR UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION update_auditor_audit_count();

-- Função para atualizar o contador quando uma auditoria é concluída ou cancelada
CREATE OR REPLACE FUNCTION update_audit_count_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') THEN
    UPDATE profiles
    SET audit_count = audit_count - 1
    WHERE id = NEW.auditor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger para atualizar o contador quando o status muda
DROP TRIGGER IF EXISTS update_audit_count_on_status_change_trigger ON audits;
CREATE TRIGGER update_audit_count_on_status_change_trigger
  AFTER UPDATE OF status ON audits
  FOR EACH ROW
  WHEN (OLD.status != NEW.status)
  EXECUTE FUNCTION update_audit_count_on_status_change();

-- Atualiza os contadores existentes
UPDATE profiles p
SET audit_count = (
  SELECT COUNT(*)
  FROM audits a
  WHERE a.auditor_id = p.id
  AND a.status IN ('pending', 'confirmed')
);