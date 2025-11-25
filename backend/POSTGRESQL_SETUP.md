# 🐘 Configuração PostgreSQL

Este projeto usa **exclusivamente PostgreSQL** como banco de dados.

## 📋 Pré-requisitos

- PostgreSQL 12+ instalado
- Node.js 18+ instalado

## 🚀 Setup Local

### 1. Instalar PostgreSQL

**Windows:**
```bash
# Baixar e instalar do site oficial
https://www.postgresql.org/download/windows/
```

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL como superusuário
psql -U postgres

# Criar banco de dados
CREATE DATABASE agendaaqui;

# Criar usuário (opcional)
CREATE USER agendaaqui_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE agendaaqui TO agendaaqui_user;

# Sair do psql
\q
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Database
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/agendaaqui

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# Mercado Pago
MP_ACCESS_TOKEN=seu_token_mercadopago

# Environment
NODE_ENV=development
PORT=3000
```

### 4. Executar Migração

```bash
cd backend
npm install
node migrate-postgres.js
```

### 5. Iniciar Servidor

```bash
npm start
```

## 🎯 Credenciais Padrão

Após executar a migração, você terá:

**Super Admin:**
- Email: `admin@vistoria.com`
- Senha: `Admin123!@#`

**Empresa Demo:**
- Nome: Vistoria Express Demo
- Slug: `demo`
- URL: `demo.agendaaquivistorias.com.br`

## 📊 Estrutura do Banco

### Tabelas Criadas

- **usuarios_admin**: Super admins da plataforma
- **empresas**: Empresas clientes (multi-tenant)
- **configuracoes**: Configurações por empresa
- **clientes**: Clientes finais de cada empresa
- **veiculos**: Veículos dos clientes
- **agendamentos**: Agendamentos de vistorias
- **pagamentos**: Pagamentos via Mercado Pago
- **transacoes**: Histórico de comissões e repasses
- **notificacoes**: Notificações do sistema

## 🔧 Comandos Úteis

### Conectar ao banco
```bash
psql -U postgres -d agendaaqui
```

### Listar tabelas
```sql
\dt
```

### Ver estrutura de uma tabela
```sql
\d usuarios_admin
```

### Resetar banco (CUIDADO!)
```bash
psql -U postgres -d agendaaqui -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
node migrate-postgres.js
```

### Ver logs do PostgreSQL
```bash
# Mac
tail -f /usr/local/var/log/postgres.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-*.log

# Windows
# Verificar no Event Viewer ou em C:\Program Files\PostgreSQL\XX\data\log\
```

## 🌐 Deploy (Produção)

### Render.com (Recomendado)

1. **Criar PostgreSQL Database** no Render:
   - Dashboard → New → PostgreSQL
   - Nome: `agendaaqui-db`
   - Copiar **Internal Database URL**

2. **Configurar Web Service:**
   - Adicionar variável `DATABASE_URL` com a Internal Database URL
   - O deploy automático rodará as migrações

### Outras Plataformas

Para Heroku, Railway, ou outras:

1. Provisionar PostgreSQL
2. Copiar DATABASE_URL
3. Adicionar às variáveis de ambiente
4. Rodar migração: `node migrate-postgres.js`

## ❓ Troubleshooting

### Erro: "DATABASE_URL não configurada"
```bash
# Certifique-se de ter o arquivo .env com DATABASE_URL configurada
cp .env.example .env
# Editar .env e adicionar DATABASE_URL
```

### Erro: "role não existe"
```bash
# Criar role/usuário no PostgreSQL
psql -U postgres -c "CREATE USER agendaaqui_user WITH PASSWORD 'sua_senha';"
```

### Erro: "database não existe"
```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE agendaaqui;"
```

### Erro de conexão
```bash
# Verificar se PostgreSQL está rodando
# Mac
brew services list

# Linux
sudo systemctl status postgresql

# Windows
# Services → PostgreSQL - verificar se está Started
```

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca commitar arquivo `.env` no git
- Usar senhas fortes em produção
- Habilitar SSL em produção (`ssl: { rejectUnauthorized: false }`)
- Fazer backup regular do banco

## 📚 Referências

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Client (pg)](https://node-postgres.com/)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
