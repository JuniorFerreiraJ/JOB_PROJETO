-- Update all existing auditors to have max_audits = 1
UPDATE profiles
SET max_audits = 1
WHERE role = 'auditor';

-- Add a constraint to ensure max_audits is always 1 for auditors
ALTER TABLE profiles
ADD CONSTRAINT check_auditor_max_audits
CHECK (
  (role != 'auditor') OR
  (role = 'auditor' AND max_audits = 1)
);