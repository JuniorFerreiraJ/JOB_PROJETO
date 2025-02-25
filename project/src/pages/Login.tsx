import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const onSubmit = async (data: LoginForm) => {
    const loadingToast = toast.loading('Autenticando...', {
      position: 'top-right',
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid rgba(255, 215, 0, 0.2)',
      },
    });

    try {
      await signIn(data.email, data.password);
      toast.success('Login realizado com sucesso!', {
        id: loadingToast,
        duration: 3000,
      });
    } catch (error: any) {
      toast.error(error.message, {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-yellow-400 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-black text-yellow-400">
                  <span className="relative">
                    J
                    <span className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                      <Search className="h-8 w-8 text-yellow-400" />
                    </span>
                    b.
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold text-yellow-400">
                Experiência do Cliente
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-yellow-400">
            Sistema de Auditoria
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Faça login para acessar o sistema
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 pl-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Senha"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 pl-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}