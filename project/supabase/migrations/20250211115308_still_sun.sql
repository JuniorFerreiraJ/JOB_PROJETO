-- Create a secure function for creating auditors
CREATE OR REPLACE FUNCTION create_auditor_secure(
    p_email text,
    p_password text,
    p_name text,
    p_whatsapp text DEFAULT NULL,
    p_max_audits integer DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Verify admin privileges
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Only administrators can create auditors';
    END IF;

    -- Create user in auth.users
    INSERT INTO auth.users (
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('name', p_name),
        'authenticated',
        'authenticated'
    )
    RETURNING id INTO new_user_id;

    -- Create profile
    INSERT INTO profiles (
        id,
        email,
        name,
        whatsapp,
        role,
        is_active,
        max_audits
    ) VALUES (
        new_user_id,
        p_email,
        p_name,
        p_whatsapp,
        'auditor',
        true,
        p_max_audits
    );

    RETURN new_user_id;
END;
$$;