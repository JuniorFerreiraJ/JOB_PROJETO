-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to ensure admin user exists
CREATE OR REPLACE FUNCTION ensure_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Check if admin exists
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = 'admin@job.com';

    -- If admin doesn't exist, create it
    IF admin_id IS NULL THEN
        -- Create admin user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            role,
            aud,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'admin@job.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']
            ),
            jsonb_build_object(
                'name', 'Administrador',
                'role', 'admin'
            ),
            'authenticated',
            'authenticated',
            now(),
            now()
        )
        RETURNING id INTO admin_id;

        -- Create admin profile
        INSERT INTO profiles (
            id,
            email,
            name,
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            'admin@job.com',
            'Administrador',
            'admin',
            true,
            now(),
            now()
        );
    END IF;
END;
$$;

-- Execute the function
SELECT ensure_admin_user();

-- Drop the function after use
DROP FUNCTION ensure_admin_user();