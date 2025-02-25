-- Primeiro, adiciona a coluna role se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN role text DEFAULT 'auditor';
    END IF;
END $$;

-- Agora que temos certeza que a coluna existe, podemos atualizar o usuário
DO $$
DECLARE
    user_exists boolean;
BEGIN
    -- Verifica se o usuário existe
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE email = 'job@gmail.com'
    ) INTO user_exists;

    IF NOT user_exists THEN
        RAISE NOTICE 'Usuário job@gmail.com não encontrado. Criando...';
        
        -- Se o usuário não existe, vamos criar o perfil
        INSERT INTO profiles (
            id,
            email,
            name,
            is_active,
            role
        )
        SELECT
            id,
            email,
            'Administrador',
            true,
            'admin'
        FROM auth.users
        WHERE email = 'job@gmail.com';
    ELSE
        -- Se o usuário existe, apenas atualiza
        UPDATE profiles
        SET 
            is_active = true,
            role = 'admin',
            updated_at = now()
        WHERE email = 'job@gmail.com';
    END IF;
END $$;

-- Garante que o usuário tem as permissões corretas no auth.users
UPDATE auth.users
SET 
    raw_app_meta_data = raw_app_meta_data || 
        jsonb_build_object('role', 'admin'),
    raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object('role', 'admin'),
    is_super_admin = true,
    updated_at = now()
WHERE email = 'job@gmail.com';