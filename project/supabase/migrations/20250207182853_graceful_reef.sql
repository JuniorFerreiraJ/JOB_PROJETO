-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Garante que admins possam gerenciar usuários
CREATE POLICY "Admins can manage users"
    ON auth.users
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Garante que admins possam gerenciar perfis
CREATE POLICY "Admins can manage profiles"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

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

    -- Cria o usuário
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        role
    ) VALUES (
        email,
        crypt(password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('name', name),
        'authenticated'
    )
    RETURNING id INTO new_user_id;

    -- Cria o perfil
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
        email,
        name,
        whatsapp,
        'auditor',
        true,
        max_audits
    );

    RETURN new_user_id;
END;
$$;