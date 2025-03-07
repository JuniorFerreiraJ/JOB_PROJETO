import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Search, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().min(10, 'WhatsApp é obrigatório'),
  age: z.number().min(18, 'Idade mínima é 18 anos'),
  residence_location: z.string().min(3, 'Cidade onde mora é obrigatória'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Criando conta...');

      // Criar usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'auditor'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          whatsapp: data.whatsapp,
          age: data.age,
          residence_location: data.residence_location,
          role: 'auditor',
          is_active: true
        });

      if (profileError) throw profileError;

      toast.success('Conta criada com sucesso!', { id: loadingToast });
      navigate('/login');
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center text-white">
              Criar Conta
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Preencha seus dados para se cadastrar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <input
                {...register('name')}
                type="text"
                placeholder="Nome Completo"
                className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

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
              <input
                {...register('whatsapp')}
                type="tel"
                placeholder="WhatsApp"
                className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-400">{errors.whatsapp.message}</p>
              )}
            </div>

            <div>
              <input
                {...register('age', { valueAsNumber: true })}
                type="number"
                placeholder="Idade"
                className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-400">{errors.age.message}</p>
              )}
            </div>

            <div>
              <input
                {...register('residence_location')}
                type="text"
                placeholder="Cidade onde mora"
                className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
              />
              {errors.residence_location && (
                <p className="mt-1 text-sm text-red-400">{errors.residence_location.message}</p>
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

            <div>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmar Senha"
                  className="block w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-black/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg hover:bg-black/70 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}