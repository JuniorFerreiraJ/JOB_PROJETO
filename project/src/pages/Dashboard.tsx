import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { ClipboardList, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp, MapPin, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface AuditSummary {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  thisMonth: number;
  nextMonth: number;
}

interface Audit {
  id: string;
  title: string;
  scheduled_date: string;
  status: string;
  location: string;
}

interface LocationStats {
  location: string;
  count: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [summary, setSummary] = useState<AuditSummary>({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    thisMonth: 0,
    nextMonth: 0
  });
  const [recentAudits, setRecentAudits] = useState<Audit[]>([]);
  const [topLocations, setTopLocations] = useState<LocationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session) {
        setError('Você precisa estar autenticado para visualizar o dashboard');
        return;
      }

      const { data: audits, error: auditsError } = await supabase
        .from('audits')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (auditsError) {
        throw auditsError;
      }

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const nextMonth = (thisMonth + 1) % 12;
      const nextMonthYear = thisMonth === 11 ? thisYear + 1 : thisYear;

      const auditsArray = audits || [];
      const pendingCount = auditsArray.filter(a => a.status === 'pending').length;
      const completedCount = auditsArray.filter(a => a.status === 'completed').length;
      const cancelledCount = auditsArray.filter(a => a.status === 'cancelled').length;

      const thisMonthCount = auditsArray.filter(a => {
        const date = new Date(a.scheduled_date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length;

      const nextMonthCount = auditsArray.filter(a => {
        const date = new Date(a.scheduled_date);
        return date.getMonth() === nextMonth && date.getFullYear() === nextMonthYear;
      }).length;

      const locationCounts = auditsArray.reduce((acc: Record<string, number>, audit) => {
        acc[audit.location] = (acc[audit.location] || 0) + 1;
        return acc;
      }, {});

      const sortedLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setSummary({
        total: auditsArray.length,
        pending: pendingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        thisMonth: thisMonthCount,
        nextMonth: nextMonthCount
      });

      setTopLocations(sortedLocations);

      const recentPendingAudits = auditsArray
        .filter(a => a.status === 'pending' && new Date(a.scheduled_date) >= now)
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
        .slice(0, 5);

      setRecentAudits(recentPendingAudits);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = handleSupabaseError(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors duration-200"
          >
            Fazer Login
          </button>
          <button
            onClick={loadDashboardData}
            className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-black rounded-lg p-6 border border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Auditorias</p>
              <h3 className="text-3xl font-bold text-white mt-1">{summary.total}</h3>
            </div>
            <div className="bg-yellow-400/10 p-3 rounded-full">
              <ClipboardList className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-black rounded-lg p-6 border border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <h3 className="text-3xl font-bold text-white mt-1">{summary.pending}</h3>
            </div>
            <div className="bg-yellow-400/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-black rounded-lg p-6 border border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Concluídas</p>
              <h3 className="text-3xl font-bold text-white mt-1">{summary.completed}</h3>
            </div>
            <div className="bg-yellow-400/10 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-black rounded-lg p-6 border border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Este Mês</p>
              <h3 className="text-3xl font-bold text-white mt-1">{summary.thisMonth}</h3>
            </div>
            <div className="bg-yellow-400/10 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Locais Mais Frequentes */}
      <div className="bg-black rounded-lg border border-yellow-400/20">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Locais Mais Auditados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topLocations.length > 0 ? (
              topLocations.map((location, index) => (
                <div key={index} className="bg-black/50 rounded-lg border border-yellow-400/10 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-400/10 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{location.location}</p>
                      <p className="text-gray-400 text-sm">{location.count} auditorias</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-400">Nenhum local registrado ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Próximas Auditorias */}
      <div className="bg-black rounded-lg border border-yellow-400/20">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Próximas Auditorias</h2>
          <div className="space-y-4">
            {recentAudits.length > 0 ? (
              recentAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/10 hover:border-yellow-400/30 cursor-pointer transition-colors duration-200"
                  onClick={() => navigate(`/audits/${audit.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-400/10 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{audit.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(audit.scheduled_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">{audit.location}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400">
                      Pendente
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Nenhuma auditoria pendente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}