import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Users, Mail, Phone, AlertCircle, X, Plus, Loader2, Search, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { sendWhatsAppInvite } from '../lib/notifications';

const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;

const auditorSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  whatsapp: z.string()
    .regex(phoneRegex, 'Formato inválido. Use (00) 00000-0000')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type AuditorForm = z.infer<typeof auditorSchema>;

interface Auditor {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  is_active: boolean;
  audit_count: number;
}

export default function AuditorManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AuditorForm>({
    resolver: zodResolver(auditorSchema)
  });

  useEffect(() => {
    if (!profile?.role === 'admin') {
      toast.error('Acesso não autorizado');
      navigate('/');
      return;
    }

    loadAuditors();
  }, [profile, navigate]);

  const loadAuditors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'auditor')
        .order('name');

      if (error) throw error;
      setAuditors(data || []);
    } catch (error) {
      console.error('Error loading auditors:', error);
      toast.error('Erro ao carregar lista de auditores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (auditorId: string) => {
    try {
      setDeleting(true);
      const loadingToast = toast.loading('Excluindo auditor...');

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', auditorId);

      if (error) throw error;

      setAuditors(prev => prev.filter(a => a.id !== auditorId));
      toast.success('Auditor excluído com sucesso', { id: loadingToast });
      setConfirmDelete(null);
    } catch (error: any) {
      console.error('Error deleting auditor:', error);
      toast.error('Erro ao excluir auditor');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (auditor: Auditor) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !auditor.is_active })
        .eq('id', auditor.id);

      if (error) throw error;

      setAuditors(prev =>
        prev.map(a =>
          a.id === auditor.id ? { ...a, is_active: !a.is_active } : a
        )
      );

      toast.success(`Auditor ${!auditor.is_active ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Error toggling auditor status:', error);
      toast.error('Erro ao alterar status do auditor');
    }
  };

  const onSubmit = async (data: AuditorForm) => {
    try {
      const loadingToast = toast.loading('Criando auditor...');

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

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          whatsapp: data.whatsapp,
          role: 'auditor',
          is_active: true,
          max_audits: 3 // Updated to 3
        });

      if (profileError) throw profileError;

      if (data.whatsapp) {
        sendWhatsAppInvite(data.whatsapp, data.name, data.email, data.password);
      }

      toast.success('Auditor criado com sucesso!', { id: loadingToast });
      reset();
      setShowForm(false);
      loadAuditors();
    } catch (error: any) {
      console.error('Error creating auditor:', error);
      toast.error(error.message || 'Erro ao criar auditor');
    }
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      const match = numbers.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
      
      if (numbers.length > 2) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      }
      if (numbers.length > 0) {
        return `(${numbers}`;
      }
    }
    
    return value;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('whatsapp', formatted);
  };

  const filteredAuditors = auditors.filter(auditor => {
    const matchesSearch = 
      auditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auditor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (auditor.whatsapp && auditor.whatsapp.includes(searchTerm));

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && auditor.is_active) ||
      (filter === 'inactive' && !auditor.is_active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Gerenciar Auditores</h1>
        <button
          onClick={() => {
            setShowForm(true);
            reset();
          }}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 w-full md:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Auditor
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, email ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="bg-black border border-yellow-400/20 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6">
        {filteredAuditors.map((auditor) => (
          <div
            key={auditor.id}
            className="bg-black/50 rounded-lg border border-yellow-400/20 p-4 md:p-6 hover:border-yellow-400/40 transition-colors duration-200"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="bg-yellow-400/10 p-3 rounded-full flex-shrink-0">
                  <Users className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-white truncate">{auditor.name}</h3>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center text-gray-400">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{auditor.email}</span>
                    </div>
                    {auditor.whatsapp && (
                      <div className="flex items-center text-gray-400">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{auditor.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center px-3 py-1 bg-yellow-400/10 rounded-full">
                  <span className="text-sm font-medium text-yellow-400">
                    {auditor.audit_count}/3 auditorias
                  </span>
                </div>
                <button
                  onClick={() => handleToggleStatus(auditor)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    auditor.is_active
                      ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                      : 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                  }`}
                >
                  {auditor.is_active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => setConfirmDelete(auditor.id)}
                  className="p-2 hover:bg-red-400/10 rounded-full transition-colors duration-200"
                  title="Excluir auditor"
                >
                  <Trash2 className="h-5 w-5 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAuditors.length === 0 && (
          <div className="text-center py-8 bg-black/50 rounded-lg border border-yellow-400/20">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum auditor encontrado</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-black rounded-lg border border-yellow-400/20 p-4 md:p-6 w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Novo Auditor</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-yellow-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o nome completo"
                      {...register('name')}
                      className="block w-full pl-3 pr-10 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-base md:text-sm"
                    />
                    {errors.name && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="exemplo@email.com"
                      {...register('email')}
                      className="block w-full pl-3 pr-10 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-base md:text-sm"
                    />
                    {errors.email && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      {...register('whatsapp')}
                      onChange={handleWhatsAppChange}
                      className="block w-full pl-3 pr-10 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-base md:text-sm"
                    />
                    {errors.whatsapp && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                    )}
                  </div>
                  {errors.whatsapp && (
                    <p className="mt-1 text-sm text-red-400">{errors.whatsapp.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Digite a senha"
                      {...register('password')}
                      className="block w-full pl-3 pr-10 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-base md:text-sm"
                    />
                    {errors.password && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                    )}
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="px-4 py-3 md:py-2 text-sm font-medium text-gray-300 hover:text-white bg-black hover:bg-yellow-400/10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 w-full md:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-4 py-3 md:py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 disabled:opacity-50 w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Auditor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black rounded-lg border border-yellow-400/20 p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir este auditor? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-black hover:bg-yellow-400/10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 flex items-center"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}