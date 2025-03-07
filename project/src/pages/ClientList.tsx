import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Search, Filter, AlertCircle, MapPin, Phone, Mail, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
}

export default function ClientList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erro ao carregar lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.state.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && client.is_active) ||
      (filter === 'inactive' && !client.is_active);

    return matchesSearch && matchesFilter;
  });

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        {profile?.role === 'admin' && (
          <button
            onClick={() => navigate('/clients/new')}
            className="flex items-center px-4 py-2 text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Cliente
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, cidade ou estado..."
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
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-black/50 rounded-lg border border-yellow-400/20 p-6 hover:border-yellow-400/40 transition-colors duration-200"
            onClick={() => profile?.role === 'admin' && navigate(`/clients/${client.id}`)}
            style={{ cursor: profile?.role === 'admin' ? 'pointer' : 'default' }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="bg-yellow-400/10 p-3 rounded-full flex-shrink-0">
                  <Building2 className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-white truncate">{client.name}</h3>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.address}, {client.city} - {client.state}</span>
                    </div>
                    {client.contact_name && (
                      <div className="flex items-center text-gray-400">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{client.contact_email}</span>
                      </div>
                    )}
                    {client.contact_phone && (
                      <div className="flex items-center text-gray-400">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{client.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.is_active
                    ? 'bg-green-400/10 text-green-400'
                    : 'bg-red-400/10 text-red-400'
                }`}>
                  {client.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}