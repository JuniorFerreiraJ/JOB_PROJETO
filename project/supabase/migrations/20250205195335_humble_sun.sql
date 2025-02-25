-- Garante que o schema auth existe e tem as permissões corretas
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Garante que a tabela de usuários existe com a estrutura correta
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL PRIMARY KEY,
    instance_id uuid,
    email text,
    encrypted_password text,
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token text,
    confirmation_sent_at timestamp with time zone,
    recovery_token text,
    recovery_sent_at timestamp with time zone,
    email_change_token_new text,
    email_change text,
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text,
    phone_confirmed_at timestamp with time zone,
    phone_change text,
    phone_change_token text,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    email_change_token_current text,
    email_change_confirm_status smallint,
    banned_until timestamp with time zone,
    reauthentication_token text,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone,
    role text DEFAULT 'authenticated'::text
);

-- Garante que o usuário demo existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'demo@exemplo.com'
    ) THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            role,
            is_super_admin
        ) VALUES (
            gen_random_uuid(),
            'demo@exemplo.com',
            crypt('123456', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            'authenticated',
            false
        ) RETURNING id;
    END IF;
END $$;

-- Garante que o perfil do usuário demo existe
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@exemplo.com';
    
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE email = 'demo@exemplo.com'
    ) AND demo_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            is_active
        ) VALUES (
            demo_user_id,
            'demo@exemplo.com',
            'Usuário Demo',
            'admin',
            true
        );
    END IF;
END $$;