# Setup do Sistema Multi-Tenant

Este documento descreve como configurar e usar o sistema multi-tenant de agendamentos.

## 🚀 Configuração Inicial

### 1. Executar Setup

Execute o script de setup para criar as tabelas e o usuário admin:

```bash
cd backend
node src/setup.js
```

Este script irá:
- Criar as tabelas necessárias (empresas, usuarios_admin, transacoes)
- Adicionar colunas de split nos agendamentos e pagamentos
- Criar configurações padrão do sistema
- Criar um usuário admin padrão

### 2. Credenciais do Admin

Por padrão, o sistema cria:
- **Email**: `admin@agendaaqui.com.br`
- **Senha**: `admin123456`

Você pode personalizar via variáveis de ambiente:
```bash
ADMIN_EMAIL=seu@email.com
ADMIN_PASSWORD=suasenha123
ADMIN_NAME="Seu Nome"
```

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## 📋 Como Funciona

### Sistema Multi-Tenant

O sistema permite que múltiplas empresas usem a mesma plataforma, cada uma com seu próprio subdomínio:

- **Domínio principal**: `agendaaqui.com.br` (site institucional)
- **Painel admin**: `admin.agendaaqui.com.br` ou `/admin`
- **Empresas**: `{slug}.agendaaqui.com.br`

Exemplos:
- `vistoriaexpress.agendaaqui.com.br` - Site da Vistoria Express
- `autocheck.agendaaqui.com.br` - Site da Auto Check

### Sistema de Pagamentos com Split

Quando um cliente faz um agendamento e paga:

1. **Pagamento** é recebido na conta principal do sistema (via Mercado Pago PIX)
2. **Split automático** divide o valor:
   - **Taxa do sistema**: R$ 5,00 (primeiros 30 dias) ou R$ 7,00 (após 30 dias)
   - **Valor da empresa**: Valor total - taxa
3. **Repasse** é criado para o PIX da empresa
4. **Transações** são registradas para rastreamento

## 🔧 Uso do Painel Admin

### Fazer Login

```bash
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@agendaaqui.com.br",
  "senha": "admin123456"
}
```

Resposta:
```json
{
  "token": "eyJhbGc...",
  "admin": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@agendaaqui.com.br",
    "role": "super_admin"
  }
}
```

**Use o token em todas as requisições seguintes:**
```
Authorization: Bearer {token}
```

### Visualizar Dashboard

```bash
GET /api/admin/dashboard
Authorization: Bearer {token}
```

Retorna:
- Resumo de transações do sistema
- Lista de todas as empresas com estatísticas
- Configurações do sistema
- Totais gerais

### Criar Nova Empresa

```bash
POST /api/admin/empresas
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Vistoria Express",
  "slug": "vistoriaexpress",
  "razao_social": "Vistoria Express LTDA",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@vistoriaexpress.com",
  "telefone": "(67) 99999-9999",
  "pix_key": "contato@vistoriaexpress.com",
  "pix_type": "email",
  "logo_url": "https://url-do-logo.com/logo.png"
}
```

**Campos obrigatórios:**
- `nome`: Nome da empresa
- `slug`: Identificador único (usado no subdomínio) - apenas letras minúsculas, números e hífen
- `email`: Email de contato
- `pix_key`: Chave PIX para receber repasses
- `pix_type`: Tipo da chave (`cpf`, `cnpj`, `email`, `telefone`, `random`)

**Campos opcionais:**
- `razao_social`: Razão social
- `cnpj`: CNPJ da empresa
- `telefone`: Telefone
- `logo_url`: URL do logotipo

Após criar, a empresa estará disponível em:
```
https://vistoriaexpress.agendaaqui.com.br
```

### Listar Empresas

```bash
GET /api/admin/empresas
Authorization: Bearer {token}

# Filtrar por status
GET /api/admin/empresas?status=ativo
```

### Ver Detalhes de uma Empresa

```bash
GET /api/admin/empresas/:id
Authorization: Bearer {token}
```

Retorna:
- Dados da empresa
- Estatísticas (agendamentos, pagamentos, valores)
- Dias de funcionamento
- Últimas transações

### Atualizar Empresa

```bash
PUT /api/admin/empresas/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "suspenso",
  "pix_key": "novachave@pix.com"
}
```

Você pode atualizar qualquer campo da empresa.

**Status possíveis:**
- `ativo`: Empresa funcionando normalmente
- `suspenso`: Empresa temporariamente suspensa
- `cancelado`: Empresa cancelada/desativada

### Deletar Empresa

```bash
DELETE /api/admin/empresas/:id
Authorization: Bearer {token}
```

⚠️ Só é possível deletar empresas sem agendamentos. Para empresas com histórico, use `status: "cancelado"`.

### Configurações do Sistema

#### Ver Configurações

```bash
GET /api/admin/configuracoes
Authorization: Bearer {token}
```

#### Atualizar Configurações

```bash
PUT /api/admin/configuracoes
Authorization: Bearer {token}
Content-Type: application/json

{
  "taxa_inicial": "500",           // R$ 5,00 em centavos
  "taxa_apos_30_dias": "700",      // R$ 7,00 em centavos
  "dias_taxa_inicial": "30",
  "pix_sistema_key": "sistema@pix.com",
  "pix_sistema_type": "email"
}
```

**Configurações disponíveis:**
- `taxa_inicial`: Taxa cobrada nos primeiros 30 dias (centavos)
- `taxa_apos_30_dias`: Taxa cobrada após 30 dias (centavos)
- `dias_taxa_inicial`: Quantidade de dias para aplicar taxa inicial
- `pix_sistema_key`: Chave PIX do sistema
- `pix_sistema_type`: Tipo da chave PIX do sistema

### Listar Transações

```bash
GET /api/admin/transacoes
Authorization: Bearer {token}

# Filtrar por empresa
GET /api/admin/transacoes?empresa_id=1

# Filtrar por tipo
GET /api/admin/transacoes?tipo=taxa

# Filtrar por status
GET /api/admin/transacoes?status=processado
```

**Tipos de transação:**
- `taxa`: Taxa recebida pelo sistema
- `repasse`: Valor a ser repassado para empresa
- `entrada`: Entrada de pagamento

**Status:**
- `pendente`: Aguardando processamento
- `processado`: Concluído com sucesso
- `erro`: Erro no processamento

## 💰 Sistema de Taxas

O sistema cobra taxas progressivas:

### Primeiros 30 dias
- **Taxa**: R$ 5,00 por agendamento

### Após 30 dias
- **Taxa**: R$ 7,00 por agendamento

A data é contada a partir de `data_inicio` da empresa (criada automaticamente).

## 🔄 Fluxo de Pagamento com Split

1. **Cliente agenda** em `vistoriaexpress.agendaaqui.com.br`
2. **Cliente paga** R$ 350,00 via PIX Mercado Pago
3. **Sistema recebe** na conta principal
4. **Webhook do Mercado Pago** notifica pagamento aprovado
5. **Split automático** calcula:
   - Empresa criada há 15 dias → Taxa de R$ 5,00
   - Valor empresa: R$ 350,00 - R$ 5,00 = R$ 345,00
6. **Transações criadas**:
   - Taxa de R$ 5,00 (receita do sistema) - status: `processado`
   - Repasse de R$ 345,00 para PIX da empresa - status: `pendente`
7. **Repasse processado** (manualmente ou via integração PIX)
8. **Status atualizado** para `processado`

## 🌐 Configuração de Subdomínios

### Desenvolvimento Local

Para testar subdomínios localmente:

1. Edite `/etc/hosts` (Mac/Linux) ou `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 localhost
127.0.0.1 vistoriaexpress.localhost
127.0.0.1 admin.localhost
```

2. Acesse:
- http://vistoriaexpress.localhost:3000
- http://admin.localhost:3000

### Produção

Configure wildcard DNS no seu provedor:
```
A @ servidor-ip
A * servidor-ip
```

Isso permite que todos os subdomínios (`*.agendaaqui.com.br`) apontem para o servidor.

## 📊 Relatórios e Estatísticas

O dashboard fornece:

- **Total de empresas** ativas e inativas
- **Total de transações** processadas
- **Receita total** em taxas
- **Total repassado** para empresas
- **Pendências** de repasse

Por empresa:
- Total de agendamentos
- Pagamentos aprovados
- Valor total recebido
- Valor repassado
- Taxas pagas
- Dias de funcionamento

## 🔒 Segurança

- Todas as rotas admin requerem autenticação via JWT
- Tokens expiram em 7 dias
- Senhas são hash com bcrypt
- Middleware de tenant valida empresa ativa
- Rate limiting aplicado

## 🐛 Troubleshooting

### Erro: "Empresa não encontrada"
- Verifique se o slug está correto
- Confirme que a empresa está `ativa`
- Verifique configuração de DNS/hosts

### Erro: "Token inválido"
- Token pode ter expirado (7 dias)
- Faça login novamente

### Split não processado
- Verifique se pagamento está com `status: 'aprovado'`
- Confirme que `empresa_id` está definido no pagamento
- Execute manualmente: Veja logs do sistema

## 📝 Variáveis de Ambiente

Adicione ao `.env`:

```bash
# Admin
ADMIN_EMAIL=admin@agendaaqui.com.br
ADMIN_PASSWORD=senhasegura123
ADMIN_NAME=Administrador

# JWT
JWT_SECRET_ADMIN=sua-chave-secreta-admin-muito-segura

# Mercado Pago
MP_ACCESS_TOKEN=seu-token-mercadopago
MP_PUBLIC_KEY=sua-public-key

# Banco de Dados
DATABASE_URL=postgresql://... # Produção (PostgreSQL)
# ou desenvolva localmente com SQLite (sem DATABASE_URL)
```

## 🚀 Deploy

O sistema detecta automaticamente o ambiente:

- **Com `DATABASE_URL`**: Usa PostgreSQL (produção)
- **Sem `DATABASE_URL`**: Usa SQLite (desenvolvimento)

1. Configure DATABASE_URL no Render/Heroku
2. Execute migrations: `node src/setup.js`
3. Configure DNS wildcard
4. Deploy!

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
