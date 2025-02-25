-- Primeiro, verifica e adiciona a coluna role se não existir
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

-- Agora podemos atualizar o usuário com segurança
UPDATE public.profiles
SET 
    is_active = true,
    role = 'admin'
WHERE email = 'job@gmail.com';

-- Atualiza as permissões no auth.users
UPDATE auth.users
SET 
    is_super_admin = true,
    raw_app_meta_data = raw_app_meta_data || 
        jsonb_build_object('role', 'admin'),
    raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object('role', 'admin')
WHERE email = 'job@gmail.com';