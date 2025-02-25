-- Primeiro remove todos os perfis para evitar violação de chave estrangeira
DELETE FROM public.profiles;

-- Depois remove todos os usuários
DELETE FROM auth.users;