# Sistema de Auditoria - Job

## Visão Geral
Sistema web desenvolvido para gerenciar auditorias, auditores e relatórios de forma eficiente e intuitiva. O sistema permite o controle completo do ciclo de vida de auditorias, desde o agendamento até a geração de relatórios.

## Tecnologias Utilizadas

### Frontend
- **React 18**: Framework JavaScript para construção da interface
- **TypeScript**: Superset do JavaScript para adicionar tipagem estática
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework CSS para estilização
- **Lucide React**: Biblioteca de ícones
- **React Router DOM**: Roteamento da aplicação
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas
- **React Hot Toast**: Notificações elegantes
- **date-fns**: Manipulação de datas

### Backend/Infraestrutura
- **Supabase**: Plataforma de backend como serviço
  - Banco de dados PostgreSQL
  - Autenticação e Autorização
  - Storage para arquivos
  - Row Level Security (RLS)
  - Realtime subscriptions

### Testes
- **Vitest**: Framework de testes
- **Testing Library**: Biblioteca para testes de componentes React
- **@testing-library/jest-dom**: Extensões do Jest para DOM testing

## Estrutura do Projeto

### Principais Diretórios
```
/src
  /components      # Componentes React reutilizáveis
  /contexts        # Contextos React (ex: AuthContext)
  /lib            # Utilitários e configurações
  /pages          # Componentes de página
  /__tests__      # Arquivos de teste
/supabase
  /migrations     # Migrações do banco de dados
```

## Funcionalidades Principais

### 1. Autenticação e Autorização
- Login com email/senha
- Controle de acesso baseado em roles (admin/auditor)
- Proteção de rotas
- Gerenciamento de sessão

### 2. Gestão de Auditores
- Cadastro e gerenciamento de auditores
- Controle de status (ativo/inativo)
- Limite de auditorias por auditor
- Visualização de métricas

### 3. Gestão de Auditorias
- Agendamento de auditorias
- Atribuição de auditores
- Acompanhamento de status
- Localização e detalhes
- Calendário visual

### 4. Relatórios de Auditoria
- Checklist customizado
- Upload de fotos
- Avaliação de risco
- Recomendações
- Data de follow-up

### 5. Dashboard
- Visão geral das auditorias
- Métricas e estatísticas
- Locais mais auditados
- Próximas auditorias

## Modelo de Dados

### Principais Tabelas

#### profiles
- Informações dos usuários
- Roles e permissões
- Dados de contato
- Métricas de auditoria

#### audits
- Dados da auditoria
- Status e agendamento
- Localização
- Auditor responsável

#### audit_reports
- Relatório detalhado
- Checklist
- Nível de risco
- Recomendações
- Fotos

## Segurança

### Row Level Security (RLS)
- Políticas por tabela
- Controle granular de acesso
- Proteção de dados sensíveis

### Autenticação
- Tokens JWT
- Sessões seguras
- Proteção contra ataques comuns

## Testes

### Testes Unitários
- Componentes React
- Hooks customizados
- Utilitários

### Testes de Integração
- Fluxos de usuário
- Interações com API
- Manipulação de estado

## Próximas Implementações

1. **Gestão de Reembolsos**
   - Submissão de despesas
   - Aprovação/rejeição
   - Histórico de pagamentos

2. **Sistema de Notificações**
   - Alertas em tempo real
   - Notificações por email
   - Lembretes de follow-up

3. **Relatórios Avançados**
   - Exportação em múltiplos formatos
   - Gráficos e análises
   - Métricas personalizadas

4. **Integrações**
   - Sistemas de pagamento
   - Calendários externos
   - Serviços de email

## Como Executar o Projeto

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```env
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
```

4. Execute o projeto:
```bash
npm run dev
```

5. Para testes:
```bash
npm run test
```

## Boas Práticas Implementadas

1. **Código**
   - TypeScript para type safety
   - ESLint para qualidade de código
   - Componentes reutilizáveis
   - Hooks customizados

2. **Performance**
   - Lazy loading de rotas
   - Otimização de imagens
   - Caching apropriado
   - Minimização de re-renders

3. **UX/UI**
   - Design responsivo
   - Feedback visual claro
   - Tratamento de erros
   - Loading states

4. **Segurança**
   - Validação de dados
   - Sanitização de inputs
   - Políticas de RLS
   - CORS configurado

## Contribuição

Para contribuir com o projeto:

1. Crie uma branch para sua feature
2. Faça commit das alterações
3. Crie um pull request
4. Aguarde review

## Licença

Este projeto está sob a licença MIT.
