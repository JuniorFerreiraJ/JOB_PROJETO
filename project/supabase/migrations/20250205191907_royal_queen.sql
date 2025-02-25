/*
  # Create demo user profile

  1. Changes
    - Create profile for demo user
    - Set up initial permissions
*/

-- Insere o perfil do usuário demo
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