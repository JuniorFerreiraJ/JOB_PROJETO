import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Clock, FileText, CheckCircle, AlertCircle, ArrowLeft, User, BarChart, AlertTriangle, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusEmoji } from '../lib/notifications';
import { deleteAudit } from '../lib/notifications';

interface Audit {
  id: string;
  title: string;
  scheduled_date: string;
  location: string;
  status: string;
  notes?: string;
  auditor_id: string;
  created_at: string;
  updated_at: string;
}

interface AuditReport {
  id: string;
  submitted_at: string;
  arrival_time?: string;
  departure_time?: string;
  total_value?: number;
  receipt_number?: string;
  consumption_checklist?: {
    entrada: boolean;
    prato_principal: boolean;
    bebida: boolean;
    sobremesa: boolean;
  };
  photos_checklist?: {
    atendentes: boolean;
    fachada: boolean;
    nota_fiscal: boolean;
    banheiro: boolean;
  };
  notes: string;
  nonconformities?: string;
  photos: Array<{
    url: string;
    type: string;
  }>;
}

interface AuditorProfile {
  name: string;
  email: string;
  whatsapp?: string;
}

export default function AuditDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [auditor, setAuditor] = useState<AuditorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Data inválida';
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'Horário não disponível';
    return timeString;
  };

  const formatMoney = (value: number | null | undefined) => {
    if (value == null) return 'Valor não disponível';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    async function loadAuditDetails() {
      try {
        if (!id) {
          navigate('/calendar');
          return;
        }

        // Carrega os detalhes da auditoria
        const { data: auditData, error: auditError } = await supabase
          .from('audits')
          .select('*')
          .eq('id', id)
          .limit(1)
          .maybeSingle();

        if (auditError) throw auditError;
        if (!auditData) {
          toast.error('Auditoria não encontrada');
          navigate('/calendar');
          return;
        }

        setAudit(auditData);

        // Carrega o perfil do auditor
        if (auditData.auditor_id) {
          const { data: auditorData, error: auditorError } = await supabase
            .from('profiles')
            .select('name, email, whatsapp')
            .eq('id', auditData.auditor_id)
            .limit(1)
            .maybeSingle();

          if (auditorError) throw auditorError;
          if (auditorData) {
            setAuditor(auditorData);
          }
        }

        // Carrega o relatório da auditoria
        const { data: reportData, error: reportError } = await supabase
          .from('audit_reports')
          .select('*')
          .eq('audit_id', id)
          .limit(1)
          .maybeSingle();

        if (reportError) throw reportError;
        if (reportData) {
          setReport(reportData);
        }
      } catch (error: any) {
        console.error('Error loading audit details:', error);
        toast.error('Erro ao carregar detalhes da auditoria');
        navigate('/calendar');
      } finally {
        setLoading(false);
      }
    }

    loadAuditDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      if (!id) return;

      const loadingToast = toast.loading('Excluindo auditoria...');

      await deleteAudit(id);

      toast.success('Auditoria excluída com sucesso', { id: loadingToast });
      navigate('/calendar');
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast.error('Erro ao excluir auditoria. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-400 text-lg">Auditoria não encontrada</p>
        <button
          onClick={() => navigate('/calendar')}
          className="mt-4 px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors duration-200"
        >
          Voltar para o Calendário
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6 text-yellow-400" />
          </button>
          <h1 className="text-3xl font-bold text-white">{audit.title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {profile?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Excluir Auditoria
            </button>
          )}
          {audit.status === 'pending' && (
            <button
              onClick={() => navigate(`/audits/${id}/report`)}
              className="flex items-center px-4 py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Enviar Relatório
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-lg border border-yellow-400/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Detalhes da Auditoria</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-400/10 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Data Agendada</p>
                  <p className="text-white">
                    {formatDate(audit.scheduled_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-yellow-400/10 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Localização</p>
                  <p className="text-white">{audit.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-yellow-400/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Auditor Responsável</p>
                  <p className="text-white">{auditor?.name || 'Não atribuído'}</p>
                  {auditor?.whatsapp && (
                    <p className="text-sm text-gray-400">{auditor.whatsapp}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  audit.status === 'completed'
                    ? 'bg-green-400/10 text-green-400'
                    : audit.status === 'pending'
                    ? 'bg-yellow-400/10 text-yellow-400'
                    : 'bg-red-400/10 text-red-400'
                }`}>
                  {getStatusEmoji(audit.status)}{' '}
                  {audit.status === 'completed' ? 'Concluída' :
                   audit.status === 'pending' ? 'Pendente' : 'Cancelada'}
                </div>
              </div>

              {audit.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Observações</p>
                  <p className="text-white whitespace-pre-wrap">{audit.notes}</p>
                </div>
              )}
            </div>
          </div>

          {report && (
            <div className="bg-black rounded-lg border border-yellow-400/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Relatório da Auditoria</h2>
              
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Horário de Chegada</p>
                    <p className="text-white">{formatTime(report.arrival_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Horário de Saída</p>
                    <p className="text-white">{formatTime(report.departure_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Valor Total</p>
                    <p className="text-white">{formatMoney(report.total_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Nota Fiscal</p>
                    <p className="text-white">{report.receipt_number || 'Não informado'}</p>
                  </div>
                </div>

                {/* Checklist de Consumo */}
                {report.consumption_checklist && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Itens Consumidos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(report.consumption_checklist).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <div className={`p-1 rounded-full ${
                            value ? 'bg-green-400/10' : 'bg-red-400/10'
                          }`}>
                            {value ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <X className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <span className="text-gray-300">
                            {key.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist de Fotos */}
                {report.photos_checklist && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Fotos Obrigatórias</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(report.photos_checklist).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <div className={`p-1 rounded-full ${
                            value ? 'bg-green-400/10' : 'bg-red-400/10'
                          }`}>
                            {value ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <X className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <span className="text-gray-300">
                            {key.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Observações</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{report.notes}</p>
                </div>

                {report.nonconformities && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Não Conformidades</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{report.nonconformities}</p>
                  </div>
                )}

                {report.photos && report.photos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Fotos</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {report.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedPhoto(photo.url)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden border border-yellow-400/20">
                            <img
                              src={photo.url}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-yellow-400/10 p-2 rounded-full">
                                <Search className="h-5 w-5 text-yellow-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-lg border border-yellow-400/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-400/10 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Auditoria Criada</p>
                  <p className="text-sm text-gray-400">
                    {formatDate(audit.created_at)}
                  </p>
                </div>
              </div>

              {report && (
                <div className="flex items-start space-x-3">
                  <div className="bg-green-400/10 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Relatório Enviado</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(report.submitted_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl w-full bg-black rounded-lg overflow-hidden">
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Foto em tamanho grande"
                className="w-full h-auto"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-colors duration-200"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}