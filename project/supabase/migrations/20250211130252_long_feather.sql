-- Add new columns to audit_reports table
ALTER TABLE audit_reports
ADD COLUMN IF NOT EXISTS arrival_time time,
ADD COLUMN IF NOT EXISTS departure_time time,
ADD COLUMN IF NOT EXISTS total_value decimal(10,2),
ADD COLUMN IF NOT EXISTS receipt_number text,
ADD COLUMN IF NOT EXISTS consumption_checklist jsonb DEFAULT '{
  "entrada": false,
  "prato_principal": false,
  "bebida": false,
  "sobremesa": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS photos_checklist jsonb DEFAULT '{
  "atendentes": false,
  "fachada": false,
  "nota_fiscal": false,
  "banheiro": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS nonconformities text;

-- Add check constraint for total_value
ALTER TABLE audit_reports
ADD CONSTRAINT check_total_value_positive
CHECK (total_value >= 0);

-- Add check constraint for receipt_number
ALTER TABLE audit_reports
ADD CONSTRAINT check_receipt_number_not_empty
CHECK (receipt_number IS NULL OR length(trim(receipt_number)) > 0);

-- Add check constraint for time values
ALTER TABLE audit_reports
ADD CONSTRAINT check_arrival_before_departure
CHECK (arrival_time < departure_time);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_reports_audit_id ON audit_reports(audit_id);