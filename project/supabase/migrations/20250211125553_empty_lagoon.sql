-- Create storage bucket for audit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-photos', 'audit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audit-photos' AND
  (auth.role() = 'authenticated')
);

-- Create storage policy to allow authenticated users to read photos
CREATE POLICY "Allow authenticated users to read photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audit-photos' AND
  (auth.role() = 'authenticated')
);

-- Create storage policy to allow authenticated users to delete their own photos
CREATE POLICY "Allow authenticated users to delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audit-photos' AND
  (auth.role() = 'authenticated')
);