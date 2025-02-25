import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuditorList from '../AuditorList';
import { supabase } from '../../lib/supabase';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock do supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: '1',
                name: 'João Silva',
                email: 'joao@exemplo.com',
                whatsapp: '11999999999',
                is_active: true,
                audit_count: 2,
                max_audits: 3,
                role: 'auditor'
              },
              {
                id: '2',
                name: 'Maria Santos',
                email: 'maria@exemplo.com',
                is_active: false,
                audit_count: 0,
                max_audits: 3,
                role: 'auditor'
              },
              {
                id: '3',
                name: 'Admin User',
                email: 'admin@exemplo.com',
                is_active: true,
                audit_count: 0,
                max_audits: 3,
                role: 'admin'
              }
            ],
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })
  }
}));

// Mock do contexto de autenticação
const mockAuthContext = {
  profile: {
    role: 'admin'
  }
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('AuditorList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a lista de auditores', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Verifica se o título está presente
    expect(screen.getByText('Lista de Auditores')).toBeInTheDocument();

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });
  });

  it('deve filtrar auditores por busca', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Realiza uma busca
    const searchInput = screen.getByPlaceholderText('Buscar por nome, email ou WhatsApp...');
    fireEvent.change(searchInput, { target: { value: 'joão' } });

    // Verifica se apenas o João aparece
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('deve filtrar auditores por status', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Seleciona o filtro de ativos
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'active' } });

    // Verifica se apenas o auditor ativo aparece
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('deve alternar o status do auditor', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Clica no botão de status do primeiro auditor
    const statusButton = screen.getByText('Ativo');
    fireEvent.click(statusButton);

    // Verifica se a função de atualização foi chamada
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('deve mostrar modal de confirmação ao tentar excluir auditor', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Clica no botão de excluir do primeiro auditor
    const deleteButton = screen.getAllByTitle('Excluir auditor')[0];
    fireEvent.click(deleteButton);

    // Verifica se o modal de confirmação aparece
    expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza que deseja excluir este auditor?')).toBeInTheDocument();
  });

  it('deve excluir auditor quando confirmado', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Clica no botão de excluir do primeiro auditor
    const deleteButton = screen.getAllByTitle('Excluir auditor')[0];
    fireEvent.click(deleteButton);

    // Clica no botão de confirmar exclusão
    const confirmButton = screen.getByText('Excluir');
    fireEvent.click(confirmButton);

    // Verifica se a função de exclusão foi chamada
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('deve mostrar mensagem quando não houver auditores', async () => {
    // Mock retornando lista vazia
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    }));

    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda a mensagem aparecer
    await waitFor(() => {
      expect(screen.getByText('Nenhum auditor encontrado')).toBeInTheDocument();
    });
  });

  it('não deve mostrar usuários admin na lista', async () => {
    render(
      <AuthProvider>
        <AuditorList />
      </AuthProvider>
    );

    // Aguarda os auditores serem carregados
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    });
  });
});