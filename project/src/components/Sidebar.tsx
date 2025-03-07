import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, ClipboardList, UserCog, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();

  const navigation = [
    { name: 'Painel', href: '/', icon: ClipboardList },
    { name: 'Clientes', href: '/clients', icon: Building2 },
    { name: 'Calendário', href: '/calendar', icon: Calendar },
  ];

  // Adiciona o item de gerenciamento apenas para administradores
  if (profile?.role === 'admin') {
    navigation.push({ name: 'Gerenciar Auditores', href: '/manage-auditors', icon: UserCog });
  }

  return (
    <div className="flex flex-col w-64 bg-black border-r border-yellow-400/20">
      <div className="flex-1 flex flex-col pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-yellow-400">Job Auditoria</h1>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  location.pathname === item.href
                    ? 'bg-yellow-400/10 text-yellow-400'
                    : 'text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400'
                } group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150`}
              >
                <Icon
                  className={`${
                    location.pathname === item.href
                      ? 'text-yellow-400'
                      : 'text-gray-400 group-hover:text-yellow-400'
                  } mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 border-t border-yellow-400/20 p-4">
        <div className="w-full">
          <div className="flex items-center justify-between space-x-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-yellow-400 truncate">
                {profile?.name || 'Usuário'}
              </div>
              <div className="text-xs font-medium text-gray-500 truncate">
                {profile?.email}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-yellow-400/10 transition-colors duration-150 flex-shrink-0"
              title="Sair"
            >
              <LogOut className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}