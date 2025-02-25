-- Garante que o schema auth existe e tem as permissões corretas
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Remove a função existente
DROP FUNCTION IF EXISTS create_auditor;

-- Recria a função usando o schema correto para gen_salt
CREATE OR REPLACE FUNCTION create_auditor(
    p_email text,
    p_password text,
    p_name text,
    p_whatsapp text DEFAULT NULL,
    p_max_audits integer DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Verifica se o usuário executando é admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar auditores';
    END IF;

    -- Verifica se o email já existe em auth.users
    IF EXISTS (
        SELECT 1 FROM auth.users WHERE auth.users.email = p_email
    ) THEN
        RAISE EXCEPTION 'Este email já está cadastrado';
    END IF;

    -- Verifica se o email já existe em profiles
    IF EXISTS (
        SELECT 1 FROM profiles WHERE profiles.email = p_email
    ) THEN
        RAISE EXCEPTION 'Este email já está em uso';
    END IF;

    -- Gera um novo UUID
    new_user_id := gen_random_uuid();

    -- Inicia uma transação
    BEGIN
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
            p_email,
            auth.crypt(p_password, auth.gen_salt('bf')),
            now(),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']
            ),
            jsonb_build_object('name', p_name),
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
            p_email,
            p_name,
            p_whatsapp,
            'auditor',
            true,
            p_max_audits,
            now(),
            now()
        );

        -- Se chegou até aqui, commit implícito
        RETURN new_user_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Este email já está cadastrado';
        WHEN others THEN
            RAISE EXCEPTION 'Erro ao criar auditor: %', SQLERRM;
    END;
END;
$$;