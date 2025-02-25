/*
  # Fix Audit Photos Schema

  1. Changes
    - Adds audit_id column to audit_photos table
    - Updates foreign key relationships
    - Maintains existing data integrity

  2. Security
    - Maintains existing RLS policies
*/

-- Add audit_id column to audit_photos
ALTER TABLE audit_photos
ADD COLUMN IF NOT EXISTS audit_id uuid REFERENCES audits(id) ON DELETE CASCADE;

-- Update audit_id based on existing relationships
UPDATE audit_photos ap
SET audit_id = ar.audit_id
FROM audit_reports ar
WHERE ap.report_id = ar.id;

-- Make audit_id NOT NULL after data migration
ALTER TABLE audit_photos
ALTER COLUMN audit_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_photos_audit_id ON audit_photos(audit_id);

-- Update RLS policies for audit_photos
DROP POLICY IF EXISTS "Allow delete for all" ON audit_photos;

CREATE POLICY "Enable delete for authenticated users"
  ON audit_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_photos.audit_id
      AND (
        audits.auditor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );