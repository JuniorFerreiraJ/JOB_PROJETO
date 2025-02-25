import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Phone, AlertCircle, Search, Filter, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Auditor {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  is_active: boolean;
  audit_count: number;
  max_audits: number;
}

export default function AuditorList() {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { profile } = useAuth();

  useEffect(() => {
    loadAuditors();
  }, []);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Lista de Auditores</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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

      <div className="grid gap-6">
        {filteredAuditors.map((auditor) => (
          <div
            key={auditor.id}
            className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-black/50 rounded-lg border border-yellow-400/10 hover:border-yellow-400/30 transition-all duration-200"
          >
            <div className="flex items-start space-x-4 mb-4 lg:mb-0">
              <div className="bg-yellow-400/10 p-3 rounded-full flex-shrink-0">
                <Users className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-medium text-white truncate">{auditor.name}</h3>
                <div className="mt-2 space-y-2 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
                  <div className="flex items-center text-gray-400">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{auditor.email}</span>
                  </div>
                  {auditor.whatsapp && (
                    <div className="flex items-center text-gray-400">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{auditor.whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
              <div className="flex items-center px-4 py-2 bg-yellow-400/10 rounded-full">
                <ClipboardList className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-yellow-400 whitespace-nowrap">
                  {auditor.audit_count}/{auditor.max_audits} auditorias
                </span>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                auditor.is_active
                  ? 'bg-green-400/10 text-green-400'
                  : 'bg-red-400/10 text-red-400'
              }`}>
                {auditor.is_active ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        ))}

        {filteredAuditors.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum auditor encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}