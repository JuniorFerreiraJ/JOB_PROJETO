/*
  # Create demo user and profile

  1. Changes
    - Create demo user with proper UUID
    - Set up initial profile with matching UUID
    - Ensure proper authentication setup
*/

-- Primeiro, remove o perfil existente se houver (deve ser feito antes de remover o usuário)
DELETE FROM public.profiles WHERE email = 'demo@exemplo.com';

-- Depois, remove o usuário existente
DELETE FROM auth.users WHERE email = 'demo@exemplo.com';

-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cria uma variável com o UUID do usuário
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Cria o usuário de teste na tabela auth.users
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
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'demo@exemplo.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  );

  -- Cria o perfil do usuário
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    is_active
  )
  VALUES (
    new_user_id,
    'demo@exemplo.com',
    'Usuário Demo',
    'auditor',
    true
  );
END $$;