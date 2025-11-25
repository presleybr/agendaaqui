-- =============================================
-- SCHEMA POSTGRESQL - SISTEMA MULTI-TENANT
-- Agendamento de Vistorias Veiculares
-- =============================================

-- Limpar tabelas existentes (CUIDADO EM PRODUÇÃO!)
DROP TABLE IF EXISTS horarios_bloqueados CASCADE;
DROP TABLE IF EXISTS transacoes CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS veiculos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS usuarios_admin CASCADE;

-- =============================================
-- TABELA: usuarios_admin
-- Super Admins da plataforma
-- =============================================
CREATE TABLE usuarios_admin (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_admin_email ON usuarios_admin(email);

-- =============================================
-- TABELA: empresas
-- Empresas clientes do sistema (SaaS Multi-Tenant)
-- =============================================
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- subdomínio (ex: vistoria-sp)
  cnpj VARCHAR(18),
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  chave_pix VARCHAR(255) NOT NULL, -- PIX para receber repasses

  -- Configurações de Preços
  preco_cautelar INTEGER DEFAULT 15000, -- em centavos (R$ 150,00)
  preco_transferencia INTEGER DEFAULT 12000, -- em centavos (R$ 120,00)
  preco_outros INTEGER DEFAULT 10000, -- em centavos (R$ 100,00)

  -- Configurações de Horário
  horario_inicio TIME DEFAULT '08:00:00',
  horario_fim TIME DEFAULT '18:00:00',
  intervalo_minutos INTEGER DEFAULT 60,

  -- Status e Plano
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('ativo', 'inativo', 'trial', 'suspenso')),
  plano VARCHAR(20) DEFAULT 'basico' CHECK (plano IN ('basico', 'premium', 'enterprise')),

  -- Comissão (primeiros 30 dias: R$ 5,00 fixo por transação)
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comissao_fixa_reais INTEGER DEFAULT 500, -- R$ 5,00 em centavos
  periodo_comissao_dias INTEGER DEFAULT 30,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_empresas_slug ON empresas(slug);
CREATE INDEX idx_empresas_status ON empresas(status);

-- =============================================
-- TABELA: configuracoes
-- Configurações por empresa (multi-tenant)
-- =============================================
CREATE TABLE configuracoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  chave VARCHAR(100) NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, chave)
);

CREATE INDEX idx_configuracoes_empresa ON configuracoes(empresa_id);
CREATE INDEX idx_configuracoes_chave ON configuracoes(chave);

-- =============================================
-- TABELA: clientes
-- Clientes finais de cada empresa
-- =============================================
CREATE TABLE clientes (
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

CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);

-- =============================================
-- TABELA: veiculos
-- =============================================
CREATE TABLE veiculos (
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

CREATE INDEX idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX idx_veiculos_empresa ON veiculos(empresa_id);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);

-- =============================================
-- TABELA: agendamentos
-- =============================================
CREATE TABLE agendamentos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,

  protocolo VARCHAR(20) UNIQUE NOT NULL,
  data_hora TIMESTAMP NOT NULL,
  tipo_vistoria VARCHAR(50) NOT NULL,
  valor INTEGER NOT NULL, -- em centavos

  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'realizado', 'cancelado')),
  status_pagamento VARCHAR(20) DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'aprovado', 'recusado', 'estornado')),

  observacoes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agendamentos_empresa ON agendamentos(empresa_id);
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_protocolo ON agendamentos(protocolo);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);

-- =============================================
-- TABELA: pagamentos
-- Pagamentos via Mercado Pago
-- =============================================
CREATE TABLE pagamentos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,

  mp_payment_id VARCHAR(100) UNIQUE,
  mp_preference_id VARCHAR(100),

  valor_total INTEGER NOT NULL, -- em centavos
  valor_empresa INTEGER, -- valor que vai para empresa (após comissão)
  valor_comissao INTEGER, -- comissão da plataforma

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  metodo_pagamento VARCHAR(50),

  pago_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pagamentos_empresa ON pagamentos(empresa_id);
CREATE INDEX idx_pagamentos_agendamento ON pagamentos(agendamento_id);
CREATE INDEX idx_pagamentos_mp_id ON pagamentos(mp_payment_id);

-- =============================================
-- TABELA: transacoes
-- Histórico de comissões e repasses
-- =============================================
CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  pagamento_id INTEGER REFERENCES pagamentos(id) ON DELETE CASCADE,

  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('comissao', 'repasse')),
  valor INTEGER NOT NULL, -- em centavos
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processado', 'falhou')),

  processado_em TIMESTAMP,
  comprovante TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transacoes_empresa ON transacoes(empresa_id);
CREATE INDEX idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX idx_transacoes_status ON transacoes(status);

-- =============================================
-- TABELA: notificacoes
-- =============================================
CREATE TABLE notificacoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,

  tipo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificacoes_empresa ON notificacoes(empresa_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- =============================================
-- TABELA: horarios_bloqueados
-- Bloqueio de horários ou dias inteiros
-- =============================================
CREATE TABLE horarios_bloqueados (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  motivo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_horarios_bloqueados_data ON horarios_bloqueados(data);

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

-- Criar triggers para atualização automática
CREATE TRIGGER update_usuarios_admin_updated_at BEFORE UPDATE ON usuarios_admin FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON transacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir Super Admin padrão
-- Senha: Admin123!@#
INSERT INTO usuarios_admin (nome, email, senha_hash, ativo) VALUES
('Super Admin', 'admin@vistoria.com', '$2a$10$Co5y0KW7QJSueX.pRjwhHO4vqcy73N/8OIiAUucMf6hiRfVEoGPy2', true)
ON CONFLICT (email) DO UPDATE SET ativo = true;

-- Inserir Empresa Demo
INSERT INTO empresas (nome, slug, email, telefone, chave_pix, status, plano) VALUES
('Vistoria Express Demo', 'demo', 'demo@vistoriaexpress.com', '(67) 99999-9999', 'demo@vistoriaexpress.com', 'ativo', 'premium');

COMMIT;
