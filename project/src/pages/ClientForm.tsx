import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Phone, MapPin, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  address: z.string().min(3, 'Endereço deve ter no mínimo 3 caracteres'),
  city: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  postal_code: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  business_hours: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
  max_audits_per_month: z.number().min(1, 'Mínimo de 1 auditoria por mês'),
  requires_special_training: z.boolean()
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      is_active: true,
      max_audits_per_month: 4,
      requires_special_training: false
    }
  });

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('Acesso não autorizado');
      navigate('/clients');
      return;
    }

    if (id) {
      loadClient();
    } else {
      setLoading(false);
    }
  }, [id, profile, navigate]);

  const loadClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        reset(data);
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Erro ao carregar dados do cliente');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientForm) => {
    try {
      const { error } = id
        ? await supabase
            .from('clients')
            .update(data)
            .eq('id', id)
        : await supabase
            .from('clients')
            .insert([data]);

      if (error) throw error;

      toast.success(`Cliente ${id ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
        >
          <ArrowLeft className="h-6 w-6 text-yellow-400" />
        </button>
        <h1 className="text-3xl font-bold text-white">
          {id ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
      </div>

      <div className="bg-black rounded-lg border border-yellow-400/20">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Nome do Estabelecimento
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('name')}
                  className="block w-full pl-10 pr-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Endereço
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('address')}
                  className="block w-full pl-10 pr-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Cidade
              </label>
              <input
                type="text"
                {...register('city')}
                className="mt-1 block w-full px-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Estado (UF)
              </label>
              <input
                type="text"
                {...register('state')}
                maxLength={2}
                className="mt-1 block w-full px-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent uppercase"
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-400">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Nome do Contato
              </label>
              <input
                type="text"
                {...register('contact_name')}
                className="mt-1 block w-full px-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email do Contato
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('contact_email')}
                  className="block w-full pl-10 pr-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-400">{errors.contact_email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Telefone do Contato
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('contact_phone')}
                  className="block w-full pl-10 pr-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Horário de Funcionamento
              </label>
              <input
                type="text"
                {...register('business_hours')}
                placeholder="Ex: Segunda a Sexta, 9h às 18h"
                className="mt-1 block w-full px-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Máximo de Auditorias por Mês
              </label>
              <input
                type="number"
                {...register('max_audits_per_month', { valueAsNumber: true })}
                min="1"
                className="mt-1 block w-full px-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              {errors.max_audits_per_month && (
                <p className="mt-1 text-sm text-red-400">{errors.max_audits_per_month.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300">
                Observações
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="mt-1 block w-full px-3 py-2 bg-black border border-yellow-400/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div className="col-span-2 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-300">
                  Cliente Ativo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('requires_special_training')}
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-300">
                  Requer Treinamento Especial
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-black hover:bg-yellow-400/10 rounded-md transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md disabled:opacity-50 transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}