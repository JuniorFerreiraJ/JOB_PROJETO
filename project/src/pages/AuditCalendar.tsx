import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, MapPin, Clock, AlertCircle, Filter, Search, ChevronLeft, ChevronRight, Trash2, Eye, Loader2, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusEmoji, deleteAudit } from '../lib/notifications';

interface Audit {
  id: string;
  title: string;
  scheduled_date: string;
  status: string;
  location: string;
}

export default function AuditCalendar() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const navigate = useNavigate();

  const loadAudits = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error loading audits:', error);
      toast.error('Erro ao carregar auditorias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const handleDelete = async (auditId: string) => {
    try {
      setDeleting(true);
      const loadingToast = toast.loading('Excluindo auditoria...');

      await deleteAudit(auditId);

      setAudits(prev => prev.filter(audit => audit.id !== auditId));
      toast.success('Auditoria excluída com sucesso', { id: loadingToast });
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast.error('Erro ao excluir auditoria');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/10 text-green-400';
      case 'pending':
        return 'bg-yellow-400/10 text-yellow-400';
      case 'cancelled':
        return 'bg-red-400/10 text-red-400';
      default:
        return 'bg-gray-400/10 text-gray-400';
    }
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = 
      audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && audit.status === 'pending') ||
      (filter === 'inactive' && audit.status !== 'pending');
    
    return matchesSearch && matchesFilter;
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { locale: ptBR });
  const endDate = endOfWeek(monthEnd, { locale: ptBR });
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and filters */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Calendário de Auditorias</h1>
        <button
          onClick={() => navigate('/audits/new')}
          className="px-4 py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
        >
          Nova Auditoria
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar auditorias..."
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
            <option value="all">Todos os Status</option>
            <option value="active">Pendentes</option>
            <option value="inactive">Concluídas/Canceladas</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('calendar')}
            className={`p-2 rounded-md transition-colors duration-200 ${
              view === 'calendar'
                ? 'bg-yellow-400 text-black'
                : 'bg-black border border-yellow-400/20 text-white hover:bg-yellow-400/10'
            }`}
            title="Visualização em calendário"
          >
            <CalendarIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-md transition-colors duration-200 ${
              view === 'list'
                ? 'bg-yellow-400 text-black'
                : 'bg-black border border-yellow-400/20 text-white hover:bg-yellow-400/10'
            }`}
            title="Visualização em lista"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-black rounded-lg border border-yellow-400/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-yellow-400" />
              </button>
              <h2 className="text-xl font-semibold text-white capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5 text-yellow-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-gray-400 text-sm py-2">
                  {day}
                </div>
              ))}
              {daysInMonth.map((date, index) => {
                const dayAudits = filteredAudits.filter(audit => 
                  isSameDay(new Date(audit.scheduled_date), date)
                );
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-yellow-400/10 rounded-md ${
                      isSameMonth(date, currentDate)
                        ? 'bg-black/50'
                        : 'bg-black/20'
                    }`}
                  >
                    <div className="text-sm text-gray-400 mb-1">
                      {format(date, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayAudits.map((audit) => (
                        <div
                          key={audit.id}
                          onClick={() => navigate(`/audits/${audit.id}`)}
                          className={`text-xs p-1 rounded cursor-pointer hover:bg-yellow-400/10 transition-colors duration-200 ${getStatusColor(audit.status)}`}
                        >
                          <div className="font-medium truncate">
                            {getStatusEmoji(audit.status)} {audit.title}
                          </div>
                          <div className="text-gray-400 truncate">
                            {format(new Date(audit.scheduled_date), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAudits.map((audit) => (
            <div
              key={audit.id}
              className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/10 hover:border-yellow-400/30 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-400/10 p-2 rounded-full">
                  <CalendarIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{audit.title}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(audit.scheduled_date), "dd/MM/yyyy HH:mm")}
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {audit.location}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(audit.status)}`}>
                  {getStatusEmoji(audit.status)}{' '}
                  {audit.status === 'completed' ? 'Concluída' :
                   audit.status === 'pending' ? 'Pendente' : 'Cancelada'}
                </span>
                <button
                  onClick={() => navigate(`/audits/${audit.id}`)}
                  className="p-2 hover:bg-yellow-400/10 rounded-full transition-colors duration-200"
                  title="Ver detalhes"
                >
                  <Eye className="h-5 w-5 text-yellow-400" />
                </button>
                <button
                  onClick={() => setConfirmDelete(audit.id)}
                  className="p-2 hover:bg-red-400/10 rounded-full transition-colors duration-200"
                  title="Excluir auditoria"
                >
                  <Trash2 className="h-5 w-5 text-red-400" />
                </button>
              </div>
            </div>
          ))}

          {filteredAudits.length === 0 && (
            <div className="text-center py-8 bg-black rounded-lg border border-yellow-400/20">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma auditoria encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black rounded-lg border border-yellow-400/20 p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir esta auditoria? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-black hover:bg-yellow-400/10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
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