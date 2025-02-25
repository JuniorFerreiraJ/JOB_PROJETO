-- Função para criar usuário admin de forma segura
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
DECLARE
    new_user_id uuid;
    existing_user_id uuid;
BEGIN
    -- Verifica se o usuário já existe
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = 'admin@job.com';

    -- Se o usuário não existe, cria um novo
    IF existing_user_id IS NULL THEN
        -- Gera novo UUID
        new_user_id := gen_random_uuid();
        
        -- Insere o usuário
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
            new_user_id,
            'admin@job.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            'authenticated',
            true
        );

        -- Insere o perfil apenas se não existir
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            is_active
        )
        SELECT
            new_user_id,
            'admin@job.com',
            'Administrador',
            'admin',
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE email = 'admin@job.com'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executa a função para criar o usuário admin
SELECT create_admin_user();

-- Remove a função após a execução
DROP FUNCTION create_admin_user();