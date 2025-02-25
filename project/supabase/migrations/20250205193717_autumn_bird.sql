/*
  # Atualizações do Sistema de Auditoria

  1. Alterações nas Tabelas
    - Adição de campos para reembolso e notas fiscais
    - Campos para controle de notificações
    - Campos para histórico de alterações

  2. Novas Tabelas
    - Tabela de notificações
    - Tabela de histórico de e-mails
    - Tabela de reembolsos

  3. Segurança
    - Políticas RLS para novas tabelas
    - Restrições e validações
*/

-- Adiciona novos campos na tabela de audits
ALTER TABLE audits
ADD COLUMN IF NOT EXISTS reimbursement_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reimbursement_due_date date,
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS notification_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_notification_date timestamptz,
ADD COLUMN IF NOT EXISTS confirmation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS max_audits_warning boolean DEFAULT false;

-- Cria tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  audit_id uuid REFERENCES audits(id),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Cria tabela de histórico de e-mails
CREATE TABLE IF NOT EXISTS email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  audit_id uuid REFERENCES audits(id),
  email_type text NOT NULL,
  sent_to text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL,
  error_message text
);

-- Cria tabela de reembolsos
CREATE TABLE IF NOT EXISTS reimbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id),
  auditor_id uuid REFERENCES auth.users(id),
  amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  receipt_url text,
  submitted_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  notes text,
  payment_date date,
  payment_method text
);

-- Habilita RLS nas novas tabelas
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursements ENABLE ROW LEVEL SECURITY;

-- Políticas para notificações
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para histórico de e-mails
CREATE POLICY "Admins can view all email history"
  ON email_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own email history"
  ON email_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para reembolsos
CREATE POLICY "Admins can do all on reimbursements"
  ON reimbursements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Auditors can view and submit own reimbursements"
  ON reimbursements
  FOR SELECT
  TO authenticated
  USING (auditor_id = auth.uid());

CREATE POLICY "Auditors can insert own reimbursements"
  ON reimbursements
  FOR INSERT
  TO authenticated
  WITH CHECK (auditor_id = auth.uid());

-- Função para verificar limite de auditorias
CREATE OR REPLACE FUNCTION check_auditor_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM audits
    WHERE auditor_id = NEW.auditor_id
    AND status IN ('pending', 'confirmed')
  ) >= 3 THEN
    UPDATE audits
    SET max_audits_warning = true
    WHERE id = NEW.id;
    
    INSERT INTO notifications (
      user_id,
      audit_id,
      type,
      title,
      message
    )
    VALUES (
      NEW.auditor_id,
      NEW.id,
      'warning',
      'Limite de Auditorias Atingido',
      'Você atingiu o limite máximo de 3 auditorias ativas.'
    );
    
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar limite de auditorias
DROP TRIGGER IF EXISTS check_auditor_limit_trigger ON audits;
CREATE TRIGGER check_auditor_limit_trigger
  BEFORE INSERT OR UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION check_auditor_limit();

-- Função para calcular data de reembolso
CREATE OR REPLACE FUNCTION calculate_reimbursement_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Define a data de vencimento do reembolso para o dia 15 do mês seguinte
  NEW.reimbursement_due_date := date_trunc('month', NEW.scheduled_date + interval '1 month') + interval '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular data de reembolso
CREATE TRIGGER set_reimbursement_due_date
  BEFORE INSERT ON audits
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reimbursement_due_date();