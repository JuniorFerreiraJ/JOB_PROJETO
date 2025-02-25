-- Remove the previous constraint that limited max_audits to 1
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_auditor_max_audits;

-- Update all existing auditors to have max_audits = 3
UPDATE profiles
SET max_audits = 3
WHERE role = 'auditor';

-- Add a new constraint to ensure max_audits is always 3 for auditors
ALTER TABLE profiles
ADD CONSTRAINT check_auditor_max_audits
CHECK (
  (role != 'auditor') OR
  (role = 'auditor' AND max_audits = 3)
);