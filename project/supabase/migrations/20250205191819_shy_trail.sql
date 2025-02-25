/*
  # Create test user

  1. Changes
    - Add test user with demo@exemplo.com email
    - Set user as active auditor
*/

-- Primeiro, insere o usuário na tabela auth.users
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
  role
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
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Depois, insere o perfil do usuário
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