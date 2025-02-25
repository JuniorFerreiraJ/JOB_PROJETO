-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remove políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Admins can manage users" ON auth.users;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Função para criar usuários de forma segura
CREATE OR REPLACE FUNCTION create_auditor(
    email text,
    password text,
    name text,
    whatsapp text DEFAULT NULL,
    max_audits integer DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Verifica se o usuário executando é admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar auditores';
    END IF;

    -- Gera um novo UUID
    new_user_id := gen_random_uuid();

    -- Cria o usuário
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        role,
        created_at,
        updated_at,
        aud
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        email,
        crypt(password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('name', name),
        'authenticated',
        now(),
        now(),
        'authenticated'
    );

    -- Cria o perfil
    INSERT INTO profiles (
        id,
        email,
        name,
        whatsapp,
        role,
        is_active,
        max_audits,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        email,
        name,
        whatsapp,
        'auditor',
        true,
        max_audits,
        now(),
        now()
    );

    RETURN new_user_id;
END;
$$;