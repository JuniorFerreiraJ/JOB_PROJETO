-- Create a secure function for creating auditors
CREATE OR REPLACE FUNCTION create_new_auditor(
    p_email text,
    p_password text,
    p_name text,
    p_whatsapp text DEFAULT NULL,
    p_max_audits integer DEFAULT 3
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify admin privileges
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can create auditors';
    END IF;

    -- Insert into profiles
    INSERT INTO profiles (
        email,
        name,
        whatsapp,
        role,
        is_active,
        max_audits
    ) VALUES (
        p_email,
        p_name,
        p_whatsapp,
        'auditor',
        true,
        p_max_audits
    );
END;
$$;