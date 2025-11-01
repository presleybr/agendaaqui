# 🚀 Guia Completo de Deploy no Render.com

Este guia mostra passo a passo como fazer o deploy completo do Sistema de Agendamento de Vistorias Veiculares no Render.com, incluindo:

- Backend (Node.js + Express)
- Banco de Dados PostgreSQL
- Frontend (Static Site)
- Webhooks do Mercado Pago
- Variáveis de Ambiente
- Configurações de Produção

## 📋 Pré-requisitos

- Conta no [Render.com](https://render.com) (gratuita)
- Conta no [GitHub](https://github.com)
- Código do projeto no GitHub
- Credenciais do Mercado Pago
- Conta de email SMTP configurada

## 🗂️ Passo 1: Preparar o Projeto para Deploy

### 1.1 Criar arquivo de migração para PostgreSQL

O Render usa PostgreSQL, não SQLite. Crie o arquivo `backend/src/migrations/run-postgres.js`:

```javascript
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('🔄 Executando migrations para PostgreSQL...\n');

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Tabela de usuários admin
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios_admin (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela usuarios_admin criada');

    // Tabela de clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela clientes criada');

    // Tabela de veículos
    await client.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(8) NOT NULL,
        marca VARCHAR(100) NOT NULL,
        modelo VARCHAR(100) NOT NULL,
        ano INTEGER NOT NULL,
        chassi VARCHAR(50),
        cliente_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela veiculos criada');

    // Tabela de agendamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id SERIAL PRIMARY KEY,
        protocolo VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INTEGER NOT NULL,
        veiculo_id INTEGER NOT NULL,
        tipo_vistoria VARCHAR(50) NOT NULL,
        data DATE NOT NULL,
        horario TIME NOT NULL,
        endereco_vistoria TEXT,
        preco INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        observacoes TEXT,
        confirmado_email BOOLEAN DEFAULT false,
        lembrete_enviado BOOLEAN DEFAULT false,
        pagamento_confirmado BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE,
        CHECK (status IN ('pendente', 'confirmado', 'realizado', 'cancelado'))
      )
    `);
    console.log('✅ Tabela agendamentos criada');

    // Tabela de configurações
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT NOT NULL,
        descricao TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela configuracoes criada');

    // Tabela de horários bloqueados
    await client.query(`
      CREATE TABLE IF NOT EXISTS horarios_bloqueados (
        id SERIAL PRIMARY KEY,
        data DATE NOT NULL,
        horario_inicio TIME,
        horario_fim TIME,
        motivo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela horarios_bloqueados criada');

    // Tabela de logs de email
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        agendamento_id INTEGER,
        tipo VARCHAR(50) NOT NULL,
        destinatario VARCHAR(255) NOT NULL,
        assunto VARCHAR(255) NOT NULL,
        enviado BOOLEAN DEFAULT false,
        erro TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela email_logs criada');

    // Tabela de pagamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id SERIAL PRIMARY KEY,
        agendamento_id INTEGER NOT NULL,
        mp_payment_id VARCHAR(255),
        tipo_pagamento VARCHAR(20) NOT NULL CHECK(tipo_pagamento IN ('pix', 'credito', 'debito')),
        valor INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
        qr_code TEXT,
        qr_code_base64 TEXT,
        payment_method_id VARCHAR(50),
        installments INTEGER DEFAULT 1,
        dados_pagamento TEXT,
        data_pagamento TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela pagamentos criada');

    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
      CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
      CREATE INDEX IF NOT EXISTS idx_agendamentos_protocolo ON agendamentos(protocolo);
      CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
      CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
      CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento ON pagamentos(agendamento_id);
      CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_payment ON pagamentos(mp_payment_id);
      CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
    `);
    console.log('✅ Índices criados');

    // Criar usuário admin padrão
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vistoria.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    const existingAdmin = await client.query('SELECT id FROM usuarios_admin WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      const senhaHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'INSERT INTO usuarios_admin (nome, email, senha_hash) VALUES ($1, $2, $3)',
        [adminName, adminEmail, senhaHash]
      );
      console.log('✅ Usuário admin criado');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminPassword}`);
    } else {
      console.log('ℹ️  Usuário admin já existe');
    }

    // Inserir configurações padrão
    const configs = [
      ['horario_inicio', '08:00', 'Horário de início do atendimento'],
      ['horario_fim', '18:00', 'Horário de fim do atendimento'],
      ['duracao_slot', '60', 'Duração de cada slot em minutos'],
      ['dias_trabalho', '1,2,3,4,5,6', 'Dias da semana que funcionam (0=Domingo, 6=Sábado)'],
      ['preco_cautelar', '15000', 'Preço da vistoria cautelar em centavos'],
      ['preco_transferencia', '12000', 'Preço da vistoria de transferência em centavos'],
      ['preco_outros', '10000', 'Preço de outros serviços em centavos'],
      ['min_antecedencia_horas', '2', 'Antecedência mínima para agendamento em horas'],
      ['max_antecedencia_dias', '30', 'Antecedência máxima para agendamento em dias'],
      ['vagas_por_horario', '3', 'Número de vagas por horário']
    ];

    for (const [chave, valor, descricao] of configs) {
      await client.query(`
        INSERT INTO configuracoes (chave, valor, descricao)
        VALUES ($1, $2, $3)
        ON CONFLICT (chave) DO NOTHING
      `, [chave, valor, descricao]);
    }
    console.log('✅ Configurações padrão inseridas');

    await client.query('COMMIT');
    console.log('\n✅ Migrations executadas com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

### 1.2 Atualizar o package.json do backend

Adicione o script de migração PostgreSQL e a dependência `pg`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "dev:tunnel": "cross-env ENABLE_TUNNEL=true nodemon src/server.js",
    "migrate": "node src/migrations/run.js",
    "migrate:postgres": "node src/migrations/run-postgres.js",
    "seed": "node src/migrations/seed.js",
    "setup": "npm run migrate && npm run seed"
  },
  "dependencies": {
    "pg": "^8.11.3",
    // ... outras dependências existentes
  }
}
```

### 1.3 Criar configuração de banco de dados adaptável

Edite `backend/src/config/database.js`:

```javascript
require('dotenv').config();

let db;

if (process.env.DATABASE_URL) {
  // PostgreSQL (Produção - Render.com)
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  db = {
    query: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    },
    exec: async (sql) => {
      const client = await pool.connect();
      try {
        await client.query(sql);
      } finally {
        client.release();
      }
    }
  };
} else {
  // SQLite (Desenvolvimento local)
  const Database = require('better-sqlite3');
  const path = require('path');

  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/agendamentos.db');
  const sqlite = new Database(dbPath, { verbose: console.log });

  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');

  db = sqlite;
}

module.exports = db;
```

### 1.4 Fazer commit e push para o GitHub

```bash
git add .
git commit -m "Preparar para deploy no Render.com com PostgreSQL"
git branch -M main
git remote add origin https://github.com/helixaibrasil/agendamento.git
git push -u origin main
```

## 🗄️ Passo 2: Criar Banco de Dados PostgreSQL no Render

1. Acesse [Render.com](https://render.com) e faça login
2. No Dashboard, clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `agendamentos-db` (ou o nome que preferir)
   - **Database**: `agendamentos`
   - **User**: `agendamentos_user` (gerado automaticamente)
   - **Region**: `Oregon (US West)` ou mais próximo do Brasil
   - **PostgreSQL Version**: 15 (ou mais recente)
   - **Plan**: **Free** (ou Starter se precisar de mais recursos)

4. Clique em **"Create Database"**

5. **IMPORTANTE**: Anote as informações de conexão:
   - **Internal Database URL** (use esta para o backend) 
postgresql://agendamentos_0jat_user:ocvizWWoGqw02cQNl8Hl6egGdawSHnHF@dpg-d42qpl75r7bs73b9huc0-a/agendamentos_0jat

   - **External Database URL** (use esta para acessar externamente se necessário)
postgresql://agendamentos_0jat_user:ocvizWWoGqw02cQNl8Hl6egGdawSHnHF@dpg-d42qpl75r7bs73b9huc0-a.oregon-postgres.render.com/agendamentos_0jat


   - **Password** (será exibido apenas uma vez!)
   Esse é o Username = ocvizWWoGqw02cQNl8Hl6egGdawSHnHF


Connections
Hostname
An internal hostname used by your Render services.
dpg-d42qpl75r7bs73b9huc0-a

Port
5432

Database
agendamentos_0jat

Username
agendamentos_0jat_user

Password
ocvizWWoGqw02cQNl8Hl6egGdawSHnHF

   

## 🔧 Passo 3: Deploy do Backend

### 3.1 Criar Web Service

1. No Dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte ao seu repositório GitHub
3. Selecione o repositório `agendamento`
4. Configure:

**Build & Deploy:**
- **Name**: `agendamentos-backend` (ou o nome que preferir)
- **Region**: Mesma do banco de dados
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run migrate:postgres`
- **Start Command**: `npm start`
- **Plan**: **Free** (ou Starter)

### 3.2 Configurar Variáveis de Ambiente

Na seção **Environment**, adicione todas as variáveis:

```env
# Node
NODE_ENV=production

# Database (copie da página do PostgreSQL)
DATABASE_URL=postgres://user:password@host/database

# JWT (GERE UMA CHAVE SEGURA!)
JWT_SECRET=sua_chave_jwt_super_segura_de_pelo_menos_32_caracteres

# Email (Configure com seu provedor SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_gmail

# Business
BUSINESS_NAME=Vistoria Veicular Express
BUSINESS_EMAIL=contato@seudominio.com
BUSINESS_PHONE=(11) 99999-9999
BUSINESS_WHATSAPP=5511999999999

# Frontend URL (será criado no próximo passo)
FRONTEND_URL=https://seu-site.onrender.com

# Admin (primeira configuração)
ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=SuaSenhaSegura123!@#
ADMIN_NAME=Administrador

# Mercado Pago (suas credenciais de produção)
MP_ACCESS_TOKEN=TEST-727307920606410-110100-b65a7008e2bd0221e134d9b2ec1abc9a-17728094
MP_PUBLIC_KEY=TEST-62c37382-077f-4b94-80c7-cd027cce815a

# Scheduling
MIN_ADVANCE_HOURS=2
MAX_ADVANCE_DAYS=30
SLOT_DURATION_MINUTES=60
WORKING_HOURS_START=08:00
WORKING_HOURS_END=18:00
WORKING_DAYS=1,2,3,4,5,6

# Prices (em centavos)
PRICE_CAUTELAR=15000
PRICE_TRANSFERENCIA=12000
PRICE_OUTROS=10000
```

### 3.3 Criar o serviço

1. Clique em **"Create Web Service"**
2. Aguarde o deploy (primeira vez pode levar 5-10 minutos)
3. Quando finalizar, você receberá uma URL tipo: `https://agendamentos-backend.onrender.com`
4. **Anote essa URL** - será usada no frontend

### 3.4 Testar a API

Acesse no navegador:
```
https://agendamentos-backend.onrender.com/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🎨 Passo 4: Deploy do Frontend

### 4.1 Configurar build do frontend

No arquivo `frontend/package.json`, certifique-se que o script de build está correto:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 4.2 Criar arquivo de variáveis de ambiente de build

Crie `frontend/.env.production`:

```env
VITE_API_URL=https://agendamentos-backend.onrender.com/api
VITE_MP_PUBLIC_KEY=sua_public_key_mercadopago
```

### 4.3 Criar Static Site no Render

1. No Dashboard, clique em **"New +"** → **"Static Site"**
2. Selecione o repositório `agendamento`
3. Configure:

**Build & Deploy:**
- **Name**: `agendamentos-frontend` (ou o nome que preferir)
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Environment Variables:**
```env
VITE_API_URL=https://agendamentos-backend.onrender.com/api
VITE_MP_PUBLIC_KEY=sua_public_key_mercadopago_producao
```

4. Clique em **"Create Static Site"**
5. Aguarde o build e deploy
6. Você receberá uma URL tipo: `https://agendamentos-frontend.onrender.com`

### 4.4 Atualizar FRONTEND_URL no backend

1. Volte ao serviço do backend no Render
2. Vá em **Environment**
3. Atualize a variável `FRONTEND_URL` com a URL do frontend:
   ```
   FRONTEND_URL=https://agendamentos-frontend.onrender.com
   ```
4. Clique em **"Save Changes"**
5. O backend será redeploy automaticamente

## 🪝 Passo 5: Configurar Webhooks do Mercado Pago

### 5.1 Obter a URL do webhook

A URL do webhook será:
```
https://agendamentos-backend.onrender.com/api/webhook/mercadopago
```

### 5.2 Configurar no Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Suas aplicações**
3. Selecione sua aplicação (ou crie uma nova para produção)
4. Clique em **Webhooks**
5. Clique em **Configurar notificações**
6. Configure:
   - **URL de produção**: `https://agendamentos-backend.onrender.com/api/webhook/mercadopago`
   - **Eventos**:
     - ✅ Pagamentos
     - ✅ Planos de assinatura
     - ✅ Cobranças
   - **Mode**: **Produção**

7. Clique em **Salvar**

### 5.3 Testar Webhooks

1. Faça um pagamento de teste no ambiente de produção
2. Verifique os logs do backend no Render
3. O webhook deve aparecer nos logs

Para ver os logs:
- Vá ao serviço backend no Render
- Clique em **Logs**
- Acompanhe em tempo real

## 🔒 Passo 6: Configurar Domínio Personalizado (Opcional)

### 6.1 Configurar domínio no Frontend

1. No serviço do frontend, clique em **"Settings"**
2. Vá em **"Custom Domain"**
3. Clique em **"Add Custom Domain"**
4. Digite seu domínio (ex: `agendamentos.seudominio.com`)
5. Siga as instruções para configurar DNS:

**Se usar Cloudflare:**
```
Type: CNAME
Name: agendamentos
Content: agendamentos-frontend.onrender.com
```

**Se usar outro provedor:**
```
Type: CNAME
Name: agendamentos
Target: agendamentos-frontend.onrender.com
```

6. Aguarde a propagação DNS (pode levar até 48h, mas geralmente é rápido)
7. O Render gerará automaticamente certificado SSL

### 6.2 Configurar domínio no Backend (Opcional)

Repita o processo para o backend com um subdomínio diferente:
```
api.seudominio.com → agendamentos-backend.onrender.com
```

### 6.3 Atualizar variáveis de ambiente

Após configurar domínios personalizados, atualize:

**Backend:**
```env
FRONTEND_URL=https://agendamentos.seudominio.com
```

**Frontend:**
```env
VITE_API_URL=https://api.seudominio.com/api
```

**Mercado Pago Webhook:**
```
https://api.seudominio.com/api/webhook/mercadopago
```

## ✅ Passo 7: Verificação Final

### 7.1 Testar a aplicação completa

1. **Landing Page**: Acesse `https://seu-frontend.onrender.com`
   - ✅ Página carrega corretamente
   - ✅ Vídeo background funciona
   - ✅ Formulário de agendamento abre

2. **Agendamento**:
   - ✅ Preencha todos os passos
   - ✅ Selecione data e horário
   - ✅ Complete o pagamento (use cartão de teste)
   - ✅ Receba confirmação

3. **Painel Administrativo**: Acesse `https://seu-frontend.onrender.com/admin.html`
   - ✅ Login funciona
   - ✅ Dashboard carrega com gráficos
   - ✅ Agendamentos aparecem
   - ✅ Relatórios funcionam
   - ✅ Exportação PDF funciona

4. **Webhooks**:
   - ✅ Pagamentos atualizam status automaticamente
   - ✅ Verifique logs no Render

### 7.2 Configurar monitoramento

1. **Uptime Monitoring**: Render tem monitoramento incluído
2. **Logs**: Acesse regularmente para ver erros
3. **Alertas**: Configure alertas de email no Render

## 🔧 Manutenção e Troubleshooting

### Ver logs em tempo real

```bash
# Instale o Render CLI (opcional)
npm install -g @render-cli/render

# Faça login
render login

# Ver logs do backend
render logs -s agendamentos-backend -f

# Ver logs do frontend
render logs -s agendamentos-frontend -f
```

### Problemas comuns

#### ❌ Erro: "Cannot connect to database"
- Verifique se `DATABASE_URL` está correta
- Teste a conexão do PostgreSQL
- Veja logs do backend

#### ❌ Erro: "CORS policy"
- Adicione o domínio do frontend no CORS do backend
- Verifique `FRONTEND_URL` no backend

#### ❌ Webhooks não funcionam
- Teste a URL manualmente
- Verifique logs do Mercado Pago
- Confira se a URL está correta no painel MP

#### ❌ Build falha
- Verifique os comandos de build
- Veja logs de build no Render
- Teste o build localmente primeiro

### Atualizar a aplicação

```bash
# Faça alterações localmente
git add .
git commit -m "Descrição das alterações"
git push origin main
```

O Render detecta o push e faz redeploy automático!

## 📊 Custos Estimados

### Plano Free (Recomendado para começar)

**PostgreSQL Free**:
- ✅ 256 MB RAM
- ✅ 1 GB Storage
- ✅ Expira após 90 dias (recria gratuitamente)
- ❌ Perde dados ao expirar

**Web Service Free**:
- ✅ 512 MB RAM
- ✅ Sleep após 15 min de inatividade
- ✅ Acordar automático ao receber requisição
- ✅ 750 horas/mês grátis

**Static Site**:
- ✅ Totalmente grátis
- ✅ 100 GB bandwidth/mês
- ✅ CDN global

**Total**: R$ 0,00/mês

### Plano Starter (Recomendado para produção)

**PostgreSQL Starter - $7/mês**:
- ✅ 256 MB RAM
- ✅ 1 GB Storage
- ✅ Persistente (não expira)
- ✅ Backups automáticos

**Web Service Starter - $7/mês**:
- ✅ 512 MB RAM
- ✅ Sempre ativo (sem sleep)
- ✅ Melhor performance

**Static Site**: Grátis

**Total**: ~R$ 70/mês (câmbio R$ 5,00)

## 🎯 Próximos Passos

Após deploy concluído:

1. ✅ Altere a senha do admin
2. ✅ Configure email SMTP profissional
3. ✅ Personalize textos e imagens
4. ✅ Configure domínio personalizado
5. ✅ Ative SSL/HTTPS (automático no Render)
6. ✅ Configure backup automático
7. ✅ Teste todos os fluxos
8. ✅ Configure Google Analytics
9. ✅ Ative Meta Pixel para ads
10. ✅ Faça testes de carga

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GitHub Issues**: https://github.com/helixaibrasil/agendamento/issues

---

**Parabéns! 🎉 Seu sistema está no ar!**

Acesse e comece a receber agendamentos online.
