# 🚀 Sistema SaaS Multi-Tenant - Guia Completo

## 📋 Visão Geral

Este sistema foi transformado em uma plataforma SaaS multi-tenant onde você (super admin) pode adicionar múltiplas empresas clientes, cada uma com seu próprio subdomínio e configurações personalizadas.

### Características Principais

- ✅ **Gestão de Empresas Clientes** via painel admin
- ✅ **Subdomínios Automáticos** (ex: empresa.agendaaquivistorias.com.br)
- ✅ **Split de Pagamento Automático**
  - Primeiros 30 dias: R$ 5,00 fixo para plataforma
  - Após 30 dias: 0% de comissão (tudo para o cliente)
- ✅ **Repasse via PIX** para chave PIX do cliente
- ✅ **Métricas e Analytics** por empresa
- ✅ **Configurações Personalizadas** (preços, horários, etc)

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `empresas`
Armazena informações das empresas clientes.

```sql
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,        -- Usado no subdomínio
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cnpj VARCHAR(18),
  chave_pix TEXT NOT NULL,                  -- PIX para repasses
  percentual_plataforma INTEGER DEFAULT 500, -- R$ 5,00 em centavos
  status VARCHAR(20) DEFAULT 'ativo',       -- ativo, inativo, suspenso, trial
  plano VARCHAR(20) DEFAULT 'basico',       -- basico, premium, enterprise
  data_inicio DATE DEFAULT CURRENT_DATE,
  -- Configurações de negócio
  preco_cautelar INTEGER DEFAULT 15000,     -- R$ 150,00 em centavos
  preco_transferencia INTEGER DEFAULT 12000,
  preco_outros INTEGER DEFAULT 10000,
  horario_inicio TIME DEFAULT '08:00',
  horario_fim TIME DEFAULT '18:00',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `pagamento_splits`
Registra a divisão de cada pagamento entre plataforma e empresa.

```sql
CREATE TABLE pagamento_splits (
  id SERIAL PRIMARY KEY,
  pagamento_id INTEGER REFERENCES pagamentos(id),
  empresa_id INTEGER REFERENCES empresas(id),
  valor_total INTEGER NOT NULL,            -- Valor total em centavos
  valor_plataforma INTEGER NOT NULL,       -- Valor da comissão
  valor_empresa INTEGER NOT NULL,          -- Valor que vai para empresa
  status_repasse VARCHAR(20) DEFAULT 'pendente', -- pendente, processando, concluido, erro
  data_repasse TIMESTAMP,
  comprovante_repasse TEXT,
  mensagem_erro TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `empresa_metricas`
Métricas mensais por empresa.

```sql
CREATE TABLE empresa_metricas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  total_agendamentos INTEGER DEFAULT 0,
  total_receita INTEGER DEFAULT 0,
  total_comissao_plataforma INTEGER DEFAULT 0,
  total_repasses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, mes, ano)
);
```

#### 4. `empresa_configuracoes`
Configurações customizadas por empresa (chave-valor).

```sql
CREATE TABLE empresa_configuracoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  chave VARCHAR(100) NOT NULL,
  valor TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, chave)
);
```

### Migração

A migração `005_multitenant_saas.sql` também adiciona `empresa_id` em todas as tabelas existentes para isolamento de dados:

- `agendamentos.empresa_id`
- `clientes.empresa_id`
- `pagamentos.empresa_id`
- `configuracoes.empresa_id`

---

## 💰 Sistema de Split de Pagamento

### Como Funciona

1. **Quando um pagamento é aprovado**, o sistema:
   - Calcula o split baseado na data de cadastro da empresa
   - Registra o split na tabela `pagamento_splits`
   - Atualiza as métricas mensais da empresa

2. **Cálculo do Split** (`PaymentSplitService.calcularSplit()`):

```javascript
const diasDesdeInicio = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));

if (diasDesdeInicio <= 30) {
  // Primeiros 30 dias: R$ 5,00 para plataforma
  valorPlataforma = 500;
  valorEmpresa = valorTotal - 500;
} else {
  // Após 30 dias: 0% comissão
  valorPlataforma = 0;
  valorEmpresa = valorTotal;

  // Zera automaticamente a comissão da empresa
  await Empresa.update(empresaId, { percentual_plataforma: 0 });
}
```

3. **Integração com Pagamentos**:
   - O split é processado em **3 pontos**:
     - Criação de pagamento PIX
     - Criação de pagamento Cartão (se aprovado)
     - Webhook do Mercado Pago (quando status muda para aprovado)

---

## 🎯 Endpoints da API

### Admin - Gestão de Empresas

Todos os endpoints requerem autenticação de Super Admin (`requireSuperAdmin`).

#### `POST /api/admin/empresas`
Cria uma nova empresa cliente.

**Body:**
```json
{
  "nome": "Vistoria Express SP",
  "slug": "vistoria-sp",
  "email": "contato@vistoriasp.com.br",
  "telefone": "(11) 99999-9999",
  "cnpj": "00.000.000/0000-00",
  "chave_pix": "contato@vistoriasp.com.br",
  "preco_cautelar": 15000,
  "preco_transferencia": 12000,
  "preco_outros": 10000,
  "horario_inicio": "08:00",
  "horario_fim": "18:00",
  "status": "ativo",
  "plano": "basico"
}
```

**Response:**
```json
{
  "mensagem": "Empresa criada com sucesso!",
  "empresa": { ... },
  "url": "https://vistoria-sp.agendaaquivistorias.com.br"
}
```

#### `GET /api/admin/empresas`
Lista todas as empresas com métricas do mês atual.

#### `GET /api/admin/empresas/:id`
Detalhes de uma empresa com métricas dos últimos 6 meses.

#### `PUT /api/admin/empresas/:id`
Atualiza uma empresa (não permite alterar o slug).

#### `DELETE /api/admin/empresas/:id`
Deleta uma empresa e **TODOS os seus dados** (cascade).

#### `PATCH /api/admin/empresas/:id/status`
Ativa/desativa uma empresa rapidamente.

#### `GET /api/admin/empresas/:id/comissao`
Verifica se empresa está no período de comissão (30 dias).

**Response:**
```json
{
  "empresa_id": 1,
  "nome": "Vistoria Express SP",
  "data_inicio": "2025-01-01",
  "dias_desde_inicio": 15,
  "comissao_atual": 500,
  "no_periodo_comissao": true,
  "dias_restantes": 15,
  "mensagem": "Ainda no período promocional de 30 dias"
}
```

#### `GET /api/admin/empresas/dashboard`
Dashboard consolidado com totais de todas as empresas.

---

## 🎨 Painel Admin - Gestão de Empresas

### Funcionalidades da Interface

1. **Dashboard de Empresas**
   - Total de empresas
   - Empresas ativas
   - Receita do mês
   - Comissões pendentes

2. **Tabela de Empresas**
   - Lista todas as empresas com:
     - Nome / Subdomínio
     - Email
     - Telefone
     - Chave PIX
     - Comissão atual (com contador de dias)
     - Status (ativo, trial, inativo, suspenso)
     - Métricas (agendamentos e receita)

3. **Ações por Empresa**
   - 👁️ **Visualizar**: Mostra detalhes e métricas
   - ✏️ **Editar**: Abre modal de edição
   - 🗑️ **Deletar**: Remove empresa (com dupla confirmação)

4. **Modal de Criação/Edição**
   - Dados básicos (nome, slug, email, telefone, CNPJ)
   - Configurações de pagamento (chave PIX)
   - Preços customizados
   - Horários de funcionamento
   - Status e plano

### Validações

- **Slug**: Apenas letras minúsculas, números e hífens
- **Email**: Formato válido
- **Chave PIX**: Obrigatória
- **Slug único**: Não pode duplicar

---

## 🔄 Fluxo de Repasse (PIX)

### Status do Repasse

1. **pendente**: Split criado, aguardando processamento
2. **processando**: Repasse em andamento
3. **concluido**: PIX enviado com sucesso
4. **erro**: Falha no processamento

### CRON Job (Futuro)

```javascript
// Processar repasses pendentes diariamente
PaymentSplitService.processarRepassesPendentes();
```

Este método:
- Busca todos os splits com `status_repasse = 'pendente'`
- Marca como `processando`
- Faz transferência PIX via API (Mercado Pago, PagSeguro, etc)
- Atualiza para `concluido` ou `erro`

### Integração PIX (Próximo Passo)

Atualmente simulado em `PaymentSplitService.simularRepasse()`.

Para integrar com API PIX real:
1. Escolher provedor (Mercado Pago, PagSeguro, Stripe, etc)
2. Obter credenciais da API
3. Implementar método de transferência
4. Substituir `simularRepasse()` pela chamada real

Exemplo com Mercado Pago:
```javascript
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const transfer = new Transfer(client);

const result = await transfer.create({
  body: {
    amount: valor_empresa / 100,
    receiver_id: empresa.mp_receiver_id, // ID Mercado Pago do cliente
    description: `Repasse - Split ${split.id}`
  }
});
```

---

## 🌐 Sistema Multi-Tenant (Subdomínios)

### Como Habilitar

O middleware de tenant detection está **DESABILITADO** em `server.js` (linha 128):

```javascript
// app.use(detectTenant); // DESABILITADO
```

Para habilitar:

1. **Configurar DNS**:
   - Adicionar registro curinga: `*.agendaaquivistorias.com.br` → IP do servidor
   - Ou adicionar subdomínio específico para cada empresa

2. **Habilitar middleware**:
```javascript
app.use(detectTenant); // Remover comentário
```

3. **Testar localmente**:
   - Adicionar em `/etc/hosts`:
     ```
     127.0.0.1 vistoria-sp.agendaaquivistorias.local
     127.0.0.1 outra-empresa.agendaaquivistorias.local
     ```

### Como Funciona

O middleware `detectTenant` (backend/src/middleware/tenantMiddleware.js):
1. Extrai o subdomínio da requisição
2. Busca a empresa pelo slug no banco
3. Adiciona `req.tenant` e `req.empresaId` em todas as rotas
4. Filtra automaticamente dados por `empresa_id`

---

## 📊 Métricas e Analytics

### Métricas Automáticas

Cada pagamento aprovado atualiza:
- `total_agendamentos`: +1
- `total_receita`: +valor_total
- `total_comissao_plataforma`: +valor_plataforma
- `total_repasses`: Atualizado quando repasse é concluído

### Consultar Métricas

```javascript
// Mês atual
const metricas = await Empresa.getMetricas(empresaId, 11, 2025);

// Últimos 6 meses
const empresa = await Empresa.findById(id, true);
console.log(empresa.metricas); // Array com 6 meses
```

---

## 🔐 Segurança

### Autenticação

- Super Admin: Tabela `usuarios_admin`
- JWT com expiração de 7 dias
- Middleware `requireSuperAdmin` em todas as rotas de empresas

### Isolamento de Dados

Quando multi-tenant estiver ativo:
- Todas as queries filtram por `empresa_id`
- Empresa só acessa seus próprios dados
- Super admin acessa tudo

---

## 🚀 Deploy em Produção

### Render.com

1. **Criar Web Service** (Backend)
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`

2. **Variáveis de Ambiente**:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=seu-secret-super-seguro
   MP_ACCESS_TOKEN=seu-mercado-pago-token
   NODE_ENV=production
   ```

3. **Rodar Migração**:
   ```bash
   # No shell do Render
   cd backend
   node src/migrations/run.js
   ```

4. **Verificar Tabelas**:
   ```bash
   psql $DATABASE_URL -c "\dt"
   # Deve mostrar: empresas, pagamento_splits, empresa_metricas, empresa_configuracoes
   ```

### Configurar Subdomínios

1. **No provedor de domínio** (ex: Registro.br):
   - Adicionar registro CNAME: `*.agendaaquivistorias.com.br` → `seu-app.onrender.com`

2. **No Render**:
   - Custom Domain: `agendaaquivistorias.com.br`
   - Wildcard: `*.agendaaquivistorias.com.br`

3. **Habilitar middleware** no código e fazer deploy

---

## 📝 Próximos Passos

### 1. Painel do Cliente (Empresa)
Criar painel read-only para clientes visualizarem:
- Seus agendamentos
- Seus clientes
- Métricas e relatórios
- Configurações (preços, horários)

### 2. Integração PIX Real
- Implementar transferências PIX via API
- Webhook para confirmação de repasse
- Notificação por email quando repasse é feito

### 3. Automação
- CRON job para processar repasses diariamente
- CRON job para zerar comissão após 30 dias
- Alertas quando empresa está próxima dos 30 dias

### 4. Planos e Recursos
Diferenciar recursos por plano:
- **Básico**: Funcionalidades essenciais
- **Premium**: Relatórios avançados, integrações
- **Enterprise**: Customizações, suporte prioritário

### 5. Onboarding
- Tutorial para novos clientes
- Email de boas-vindas com instruções
- Verificação de chave PIX válida

---

## 🐛 Troubleshooting

### Erro: "Empresa não encontrada"
- Verificar se `empresa_id` está sendo passado nas requisições
- Checar se middleware de tenant está ativo (se usando subdomínios)

### Erro: "Split não registrado"
- Verificar logs: `console.log` em `payment.js`
- Checar se `agendamento.empresa_id` existe
- Ver se migration foi executada

### Comissão não zerando após 30 dias
- Verificar campo `data_inicio` da empresa
- Executar manualmente:
  ```javascript
  await PaymentSplitService.calcularSplit(empresaId, valorTotal);
  ```

### Frontend não carrega lista de empresas
- Abrir DevTools → Console
- Verificar erro de autenticação
- Confirmar que token JWT está válido
- Checar rota: `GET /api/admin/empresas`

---

## 📚 Recursos Adicionais

### Arquivos Importantes

- **Backend**:
  - `backend/src/services/PaymentSplitService.js` - Lógica de split
  - `backend/src/controllers/empresaController.js` - CRUD de empresas
  - `backend/src/models/Empresa.js` - Model de empresa
  - `backend/src/routes/empresas.js` - Rotas da API

- **Frontend**:
  - `frontend/src/components/EmpresasManager.js` - Componente de gestão
  - `frontend/admin.html` - Seção de empresas (linha 747)
  - `frontend/src/admin.js` - Integração do EmpresasManager

- **Migrations**:
  - `backend/src/migrations/005_multitenant_saas.sql` - Schema completo

### Comandos Úteis

```bash
# Rodar migration
cd backend && node src/migrations/run.js

# Ver estrutura do banco
psql $DATABASE_URL -c "\d empresas"

# Contar empresas
psql $DATABASE_URL -c "SELECT COUNT(*) FROM empresas;"

# Ver splits pendentes
psql $DATABASE_URL -c "SELECT * FROM pagamento_splits WHERE status_repasse = 'pendente';"

# Simular processamento de repasses (dev)
node -e "
const PaymentSplitService = require('./backend/src/services/PaymentSplitService');
PaymentSplitService.processarRepassesPendentes();
"
```

---

**Desenvolvido com ❤️ para Agenda Aqui Vistorias**

*Versão: 1.0.0 | Data: 2025-11-23*
