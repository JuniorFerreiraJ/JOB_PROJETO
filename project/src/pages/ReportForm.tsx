import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { FileText, AlertCircle, Upload, Camera, X, CheckCircle, Clock, Receipt, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const reportSchema = z.object({
  // Informações básicas
  arrival_time: z.string().min(1, 'Horário de chegada é obrigatório'),
  departure_time: z.string().min(1, 'Horário de saída é obrigatório'),
  total_value: z.number().min(0, 'Valor total é obrigatório'),
  receipt_number: z.string().min(1, 'Número da nota fiscal é obrigatório'),
  
  // Checklist de consumo
  consumption_checklist: z.object({
    entrada: z.boolean(),
    prato_principal: z.boolean(),
    bebida: z.boolean(),
    sobremesa: z.boolean(),
  }),

  // Checklist de fotos
  photos_checklist: z.object({
    atendentes: z.boolean(),
    fachada: z.boolean(),
    nota_fiscal: z.boolean(),
    banheiro: z.boolean(),
  }),

  // Observações
  notes: z.string().min(1, 'Observações são obrigatórias'),
  nonconformities: z.string().optional(),
});

type ReportForm = z.infer<typeof reportSchema>;

interface PhotoPreview {
  id: string;
  url: string;
  type: string;
}

export default function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      consumption_checklist: {
        entrada: false,
        prato_principal: false,
        bebida: false,
        sobremesa: false,
      },
      photos_checklist: {
        atendentes: false,
        fachada: false,
        nota_fiscal: false,
        banheiro: false,
      },
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files) return;

      // Check if adding new photos would exceed the limit
      if (photos.length + files.length > 4) {
        toast.error('Limite máximo de 4 fotos por relatório');
        return;
      }

      setUploading(true);
      const newPhotos: PhotoPreview[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} excede o limite de 10MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audit-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('audit-photos')
          .getPublicUrl(filePath);

        newPhotos.push({
          id: fileName,
          url: publicUrl,
          type: 'evidence',
        });
      }

      setPhotos(prev => [...prev, ...newPhotos]);
      toast.success('Fotos enviadas com sucesso!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase.storage
        .from('audit-photos')
        .remove([`${id}/${photoId}`]);

      if (error) throw error;

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      toast.success('Foto removida com sucesso!');
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Erro ao remover foto');
    }
  };

  const onSubmit = async (data: ReportForm) => {
    try {
      if (photos.length < 4) {
        toast.error('É necessário enviar todas as fotos obrigatórias');
        return;
      }

      const { error: reportError } = await supabase
        .from('audit_reports')
        .insert([
          {
            audit_id: id,
            arrival_time: data.arrival_time,
            departure_time: data.departure_time,
            total_value: data.total_value,
            receipt_number: data.receipt_number,
            consumption_checklist: data.consumption_checklist,
            photos_checklist: data.photos_checklist,
            notes: data.notes,
            nonconformities: data.nonconformities,
            photos: photos.map(photo => ({
              url: photo.url,
              type: photo.type,
            })),
          },
        ]);

      if (reportError) throw reportError;

      const { error: auditError } = await supabase
        .from('audits')
        .update({ status: 'completed' })
        .eq('id', id);

      if (auditError) throw auditError;

      toast.success('Relatório enviado com sucesso!');
      navigate(`/audits/${id}`);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error('Erro ao enviar relatório');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Enviar Relatório</h1>
      </div>

      <div className="bg-black rounded-lg border border-yellow-400/20">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Informações da Visita</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Horário de Chegada
                </label>
                <input
                  type="time"
                  {...register('arrival_time')}
                  className="mt-1 block w-full rounded-md bg-black border border-yellow-400/20 text-white"
                />
                {errors.arrival_time && (
                  <p className="mt-1 text-sm text-red-400">{errors.arrival_time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Horário de Saída
                </label>
                <input
                  type="time"
                  {...register('departure_time')}
                  className="mt-1 block w-full rounded-md bg-black border border-yellow-400/20 text-white"
                />
                {errors.departure_time && (
                  <p className="mt-1 text-sm text-red-400">{errors.departure_time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Valor Total (R$)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('total_value', { valueAsNumber: true })}
                    className="block w-full pl-10 rounded-md bg-black border border-yellow-400/20 text-white"
                    placeholder="0.00"
                  />
                </div>
                {errors.total_value && (
                  <p className="mt-1 text-sm text-red-400">{errors.total_value.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Número da Nota Fiscal
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Receipt className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('receipt_number')}
                    className="block w-full pl-10 rounded-md bg-black border border-yellow-400/20 text-white"
                  />
                </div>
                {errors.receipt_number && (
                  <p className="mt-1 text-sm text-red-400">{errors.receipt_number.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Checklist de Consumo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Itens Consumidos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('consumption_checklist.entrada')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Entrada</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('consumption_checklist.prato_principal')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Prato Principal ou Porção</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('consumption_checklist.bebida')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Bebida (refrigerante/suco/água)</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('consumption_checklist.sobremesa')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Sobremesa</span>
              </label>
            </div>
          </div>

          {/* Checklist de Fotos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Fotos Obrigatórias</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('photos_checklist.atendentes')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Foto de Todos os Atendentes</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('photos_checklist.fachada')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Fachada</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('photos_checklist.nota_fiscal')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Nota Fiscal</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('photos_checklist.banheiro')}
                  className="form-checkbox h-5 w-5 text-yellow-400"
                />
                <span className="text-gray-300">Banheiro</span>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Observações Gerais
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="mt-1 block w-full rounded-md bg-black border border-yellow-400/20 text-white"
                placeholder="Descreva detalhadamente sua experiência..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Não Conformidades
              </label>
              <textarea
                {...register('nonconformities')}
                rows={4}
                className="mt-1 block w-full rounded-md bg-black border border-yellow-400/20 text-white"
                placeholder="Liste todas as não conformidades encontradas..."
              />
            </div>
          </div>

          {/* Upload de Fotos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Evidências Fotográficas</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-yellow-400/20"
                >
                  <img
                    src={photo.url}
                    alt="Evidência"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-400/20 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    <p className="mt-2 text-sm text-gray-400">Enviando fotos...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-400">
                      <label className="relative cursor-pointer rounded-md font-medium text-yellow-400 hover:text-yellow-500">
                        <span>Fazer upload de fotos</span>
                        <input
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={photos.length >= 4}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF até 10MB (máximo 4 fotos)
                      {photos.length > 0 && (
                        <span className="block mt-1">
                          {photos.length}/4 fotos enviadas
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-black hover:bg-yellow-400/10 rounded-md transition-colors duration-200"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="flex items-center px-4 py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md disabled:opacity-50 transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enviar Relatório
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}