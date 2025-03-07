import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage,
    storageKey: 'job-audit-auth'
  }
});

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.message?.includes('AbortError') ||
      error.message?.includes('timeout')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  if (error.message?.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos';
  }

  if (error.message?.includes('user_already_exists')) {
    return 'Este email já está cadastrado';
  }

  if (error.code === '23505' && error.message?.includes('profiles_email_key')) {
    return 'Este email já está em uso';
  }

  if (error.code === '23503') {
    return 'Não é possível excluir este registro pois existem dados vinculados';
  }

  if (error.code === '42501') {
    return 'Você não tem permissão para realizar esta ação';
  }

  if (error.code === 'PGRST116') {
    return 'Nenhum registro encontrado';
  }

  return error.message || 'Ocorreu um erro inesperado. Tente novamente.';
};