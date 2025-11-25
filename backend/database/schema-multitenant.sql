-- Schema para Sistema Multi-Tenant
-- Suporta PostgreSQL e SQLite

-- Tabela de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS empresas (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite
  -- id SERIAL PRIMARY KEY, -- PostgreSQL
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- usado para subdomínio
  razao_social VARCHAR(255),
  cnpj VARCHAR(18),
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),

  -- Configurações de Pagamento PIX
  pix_key VARCHAR(255) NOT NULL,
  pix_type VARCHAR(20) NOT NULL, -- cpf, cnpj, email, telefone, random

  -- Logo
  logo_url VARCHAR(500),

  -- Status
  status VARCHAR(20) DEFAULT 'ativo', -- ativo, suspenso, cancelado
  data_inicio DATE NOT NULL DEFAULT (date('now')), -- SQLite
  -- data_inicio DATE NOT NULL DEFAULT CURRENT_DATE, -- PostgreSQL

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários Admin (Sistema)
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite
  -- id SERIAL PRIMARY KEY, -- PostgreSQL
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
  status VARCHAR(20) DEFAULT 'ativo',
  ultimo_acesso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite
  -- id SERIAL PRIMARY KEY, -- PostgreSQL
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
  descricao TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO configuracoes_sistema (chave, valor, tipo, descricao) VALUES
('taxa_inicial', '500', 'number', 'Taxa cobrada nos primeiros 30 dias (em centavos) - R$ 5,00'),
('taxa_apos_30_dias', '700', 'number', 'Taxa cobrada após 30 dias (em centavos) - R$ 7,00'),
('dias_taxa_inicial', '30', 'number', 'Número de dias para aplicar taxa inicial'),
('pix_sistema_key', '', 'string', 'Chave PIX do sistema para receber pagamentos'),
('pix_sistema_type', 'email', 'string', 'Tipo da chave PIX do sistema')
ON CONFLICT(chave) DO NOTHING; -- PostgreSQL
-- Para SQLite: INSERT OR IGNORE INTO...

-- Atualizar tabela de Agendamentos para incluir empresa_id
ALTER TABLE agendamentos ADD COLUMN empresa_id INTEGER REFERENCES empresas(id);

-- Atualizar tabela de Pagamentos para incluir split
ALTER TABLE pagamentos ADD COLUMN empresa_id INTEGER REFERENCES empresas(id);
ALTER TABLE pagamentos ADD COLUMN valor_taxa INTEGER DEFAULT 0; -- taxa em centavos
ALTER TABLE pagamentos ADD COLUMN valor_empresa INTEGER DEFAULT 0; -- valor que vai para empresa
ALTER TABLE pagamentos ADD COLUMN status_repasse VARCHAR(50) DEFAULT 'pendente'; -- pendente, processado, erro
ALTER TABLE pagamentos ADD COLUMN data_repasse TIMESTAMP;
ALTER TABLE pagamentos ADD COLUMN split_data TEXT; -- JSON com dados do split

-- Tabela de Transações (para rastrear splits e repasses)
CREATE TABLE IF NOT EXISTS transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite
  -- id SERIAL PRIMARY KEY, -- PostgreSQL
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  pagamento_id INTEGER REFERENCES pagamentos(id),
  agendamento_id INTEGER REFERENCES agendamentos(id),

  tipo VARCHAR(50) NOT NULL, -- entrada, repasse, taxa
  valor INTEGER NOT NULL, -- em centavos
  descricao TEXT,

  -- Dados do PIX
  pix_key VARCHAR(255),
  pix_txid VARCHAR(255),
  pix_status VARCHAR(50), -- pendente, pago, cancelado

  status VARCHAR(50) DEFAULT 'pendente',
  data_processamento TIMESTAMP,
  erro_mensagem TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_pagamento ON transacoes(pagamento_id);
