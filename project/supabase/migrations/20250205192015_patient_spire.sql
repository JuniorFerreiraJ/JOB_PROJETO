/*
  # Create test user and permissions

  1. Changes
    - Create test user with proper permissions
    - Set up initial role and profile
*/

-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  '00000000-0000-0000-0000-000000000000',
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
)
ON CONFLICT (id) DO NOTHING;

-- Cria o perfil do usuário
INSERT INTO public.profiles (
  id,
  email,
  name,
  role,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'demo@exemplo.com',
  'Usuário Demo',
  'auditor',
  true
)
ON CONFLICT (id) DO NOTHING;