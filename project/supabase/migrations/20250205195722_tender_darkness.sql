-- Function to safely create or update admin user
CREATE OR REPLACE FUNCTION create_or_update_admin_user()
RETURNS void AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- First, try to find existing admin user
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@job.com';

    -- If admin user doesn't exist, create new one
    IF admin_user_id IS NULL THEN
        -- Generate new UUID for admin user
        admin_user_id := gen_random_uuid();
        
        -- Insert new admin user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@job.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            jsonb_build_object(
                'provider', 'email',
                'providers', array['email']
            ),
            '{}'::jsonb,
            true,
            'authenticated',
            'authenticated'
        );
    END IF;

    -- Update or insert admin profile
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        is_active
    ) VALUES (
        admin_user_id,
        'admin@job.com',
        'Administrador',
        'admin',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_or_update_admin_user();

-- Clean up by dropping the function
DROP FUNCTION create_or_update_admin_user();