import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, FileText, AlertCircle, Users, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Auditor {
  id: string;
  name: string;
  email: string;
  audit_count: number;
  max_audits: number;
  is_active: boolean;
}

const auditSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  scheduled_date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().min(3, 'Localização deve ter no mínimo 3 caracteres'),
  auditor_id: z.string().min(1, 'Selecione um auditor'),
  notes: z.string().optional(),
});

type AuditForm = z.infer<typeof auditSchema>;

export default function AuditForm() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuditForm>({
    resolver: zodResolver(auditSchema),
  });

  useEffect(() => {
    if (!user || !profile) {
      toast.error('Você precisa estar autenticado para criar auditorias');
      navigate('/login');
      return;
    }

    if (!profile.is_active) {
      toast.error('Sua conta está inativa. Entre em contato com o administrador.');
      navigate('/');
      return;
    }

    loadAuditors();
  }, [user, profile, navigate]);

  const loadAuditors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, audit_count, max_audits, is_active')
        .eq('role', 'auditor')
        .eq('is_active', true)
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

  const onSubmit = async (data: AuditForm) => {
    try {
      const loadingToast = toast.loading('Criando auditoria...');

      // Verifica se o auditor selecionado existe e está ativo
      const selectedAuditor = auditors.find(a => a.id === data.auditor_id);
      if (!selectedAuditor) {
        throw new Error('Auditor não encontrado');
      }

      if (!selectedAuditor.is_active) {
        throw new Error('Este auditor está inativo');
      }

      // Verifica se o auditor não excedeu o limite de auditorias
      if (selectedAuditor.audit_count >= selectedAuditor.max_audits) {
        throw new Error('Este auditor já atingiu o limite máximo de auditorias');
      }

      const { error } = await supabase
        .from('audits')
        .insert([
          {
            ...data,
            status: 'pending',
          },
        ]);

      if (error) throw error;

      toast.success('Auditoria criada com sucesso!', { id: loadingToast });
      navigate('/calendar');
    } catch (error: any) {
      console.error('Error creating audit:', error);
      toast.error(error.message || 'Erro ao criar auditoria');
    }
  };

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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
        >
          <ArrowLeft className="h-6 w-6 text-yellow-400" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Nova Auditoria</h1>
      </div>

      <div className="bg-black rounded-lg border border-yellow-400/20">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
          <div className="space-y-4">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                Título da Auditoria
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('title')}
                  type="text"
                  className="block w-full px-3 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Ex: Auditoria de Segurança - Unidade SP"
                />
                {errors.title && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title.message}
                  </div>
                )}
              </div>
            </div>

            {/* Auditor */}
            <div>
              <label htmlFor="auditor_id" className="block text-sm font-medium text-gray-300">
                Auditor Responsável
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register('auditor_id')}
                  className="block w-full pl-10 px-3 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="">Selecione um auditor</option>
                  {auditors.map((auditor) => (
                    <option 
                      key={auditor.id} 
                      value={auditor.id}
                      disabled={auditor.audit_count >= auditor.max_audits}
                    >
                      {auditor.name} ({auditor.audit_count}/{auditor.max_audits} auditorias)
                    </option>
                  ))}
                </select>
                {errors.auditor_id && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.auditor_id.message}
                  </div>
                )}
              </div>
            </div>

            {/* Data Agendada */}
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-300">
                Data Agendada
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('scheduled_date')}
                  type="datetime-local"
                  className="block w-full pl-10 px-3 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent [color-scheme:dark]"
                />
                {errors.scheduled_date && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.scheduled_date.message}
                  </div>
                )}
              </div>
            </div>

            {/* Localização */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                Localização
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('location')}
                  type="text"
                  className="block w-full pl-10 px-3 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                />
                {errors.location && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.location.message}
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
                Instruções/Observações
              </label>
              <div className="mt-1 relative">
                <div className="absolute top-3 left-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="block w-full pl-10 px-3 py-3 md:py-2 bg-black border border-yellow-400/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Instruções específicas para o auditor..."
                />
                {errors.notes && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.notes.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
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
                'Criar Auditoria'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}