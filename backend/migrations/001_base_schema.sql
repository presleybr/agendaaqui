-- Migration 001: Schema Base (SEGURO PARA PRODUÇÃO)
-- Cria todas as tabelas base usando IF NOT EXISTS
-- NUNCA usa DROP TABLE

-- =============================================
-- TABELA: usuarios_admin
-- Super Admins da plataforma
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin(email);

-- =============================================
-- TABELA: empresas
-- Empresas clientes do sistema (SaaS Multi-Tenant)
-- =============================================
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  chave_pix VARCHAR(255) NOT NULL,

  -- Configurações de Preços
  preco_cautelar INTEGER DEFAULT 15000,
  preco_transferencia INTEGER DEFAULT 12000,
  preco_outros INTEGER DEFAULT 10000,

  -- Configurações de Horário
  horario_inicio TIME DEFAULT '08:00:00',
  horario_fim TIME DEFAULT '18:00:00',
  intervalo_minutos INTEGER DEFAULT 60,

  -- Status e Plano
  status VARCHAR(20) DEFAULT 'trial',
  plano VARCHAR(20) DEFAULT 'basico',

  -- Comissão
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comissao_fixa_reais INTEGER DEFAULT 500,
  periodo_comissao_dias INTEGER DEFAULT 30,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);

-- =============================================
-- TABELA: configuracoes
-- =============================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  chave VARCHAR(100) NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, chave)
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa ON configuracoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);

-- =============================================
-- TABELA: clientes
-- =============================================
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);

-- =============================================
-- TABELA: veiculos
-- =============================================
CREATE TABLE IF NOT EXISTS veiculos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  placa VARCHAR(10) NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  ano INTEGER,
  cor VARCHAR(50),
  chassi VARCHAR(50),
  renavam VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_empresa ON veiculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);

-- =============================================
-- TABELA: agendamentos
-- =============================================
CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,

  protocolo VARCHAR(20) UNIQUE NOT NULL,
  data_hora TIMESTAMP NOT NULL,
  tipo_vistoria VARCHAR(50) NOT NULL,
  valor INTEGER NOT NULL,

  status VARCHAR(20) DEFAULT 'pendente',
  status_pagamento VARCHAR(20) DEFAULT 'pendente',

  observacoes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_protocolo ON agendamentos(protocolo);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);

-- =============================================
-- TABELA: pagamentos
-- =============================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,

  mp_payment_id VARCHAR(100) UNIQUE,
  mp_preference_id VARCHAR(100),

  valor_total INTEGER NOT NULL,
  valor_empresa INTEGER,
  valor_comissao INTEGER,

  status VARCHAR(20) DEFAULT 'pending',
  metodo_pagamento VARCHAR(50),

  pago_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento ON pagamentos(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_id ON pagamentos(mp_payment_id);

-- =============================================
-- TABELA: transacoes
-- =============================================
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  pagamento_id INTEGER REFERENCES pagamentos(id) ON DELETE CASCADE,

  tipo VARCHAR(20) NOT NULL,
  valor INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',

  processado_em TIMESTAMP,
  comprovante TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);

-- =============================================
-- TABELA: notificacoes
-- =============================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,

  tipo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_empresa ON notificacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- =============================================
-- TABELA: horarios_bloqueados
-- =============================================
CREATE TABLE IF NOT EXISTS horarios_bloqueados (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  motivo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_horarios_bloqueados_data ON horarios_bloqueados(data);
CREATE INDEX IF NOT EXISTS idx_horarios_bloqueados_empresa ON horarios_bloqueados(empresa_id);

-- =============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- DADOS INICIAIS (apenas se não existirem)
-- =============================================

-- Inserir Super Admin padrão (senha: Admin123!@#)
INSERT INTO usuarios_admin (nome, email, senha_hash, ativo)
VALUES ('Super Admin', 'admin@vistoria.com', '$2a$10$Co5y0KW7QJSueX.pRjwhHO4vqcy73N/8OIiAUucMf6hiRfVEoGPy2', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir Empresa Demo
INSERT INTO empresas (nome, slug, email, telefone, chave_pix, status, plano)
VALUES ('Vistoria Express Demo', 'demo', 'demo@vistoriaexpress.com', '(67) 99999-9999', 'demo@vistoriaexpress.com', 'ativo', 'premium')
ON CONFLICT (slug) DO NOTHING;
