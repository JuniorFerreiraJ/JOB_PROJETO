import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const onSubmit = async (data: LoginForm) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Autenticando...');
      
      await signIn(data.email, data.password);
      
      toast.success('Login realizado com sucesso!', { id: loadingToast });
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-6 w-6 text-yellow-400 transform -scale-x-100" />
            </div>
          </div>
          <p className="text-yellow-400 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-black flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-12">
        <div className="text-center">
          <div className="text-6xl font-black text-yellow-400 tracking-tighter relative">
            J<span className="inline-flex items-center"><Search className="h-12 w-12 -mt-2 transform -scale-x-100" /></span>b.
          </div>
          <div className="text-sm font-medium text-yellow-400/80 mt-2">
            Experiência do Cliente
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center text-white">
              Entrar
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Faça login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-yellow-400/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-b from-[#1a1a1a] to-black text-gray-400">ou</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/signup')}
              className="mt-6 w-full px-4 py-3 text-sm font-medium text-white bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg hover:bg-black/70 transition-colors duration-200"
            >
              Criar nova conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}