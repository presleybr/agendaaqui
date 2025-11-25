-- Migration 005: Sistema Multi-Tenant SaaS
-- Cria estrutura para múltiplas empresas clientes com subdomínios

-- Tabela de empresas (tenants/clientes da plataforma)
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,

  -- Dados da empresa
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- usado no subdomínio
  cnpj VARCHAR(18) UNIQUE,

  -- Contato
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),

  -- Endereço (opcional)
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(9),

  -- Configurações de pagamento
  chave_pix TEXT NOT NULL, -- Chave PIX do cliente para receber pagamentos
  percentual_plataforma INTEGER DEFAULT 500, -- 500 = R$ 5,00 fixo por transação

  -- Configurações do negócio
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#1976d2',
  cor_secundaria VARCHAR(7) DEFAULT '#424242',

  -- Preços customizados (em centavos)
  preco_cautelar INTEGER DEFAULT 15000,
  preco_transferencia INTEGER DEFAULT 12000,
  preco_outros INTEGER DEFAULT 10000,

  -- Horários de funcionamento customizados
  horario_inicio TIME DEFAULT '08:00',
  horario_fim TIME DEFAULT '18:00',
  dias_trabalho VARCHAR(20) DEFAULT '1,2,3,4,5,6', -- 0=Dom, 6=Sáb

  -- Status e controle
  status VARCHAR(20) DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'suspenso', 'trial')),
  plano VARCHAR(50) DEFAULT 'basico', -- basico, premium, enterprise
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE, -- NULL = sem data de fim

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adiciona coluna empresa_id em todas as tabelas existentes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;

-- Tabela de splits de pagamento (registro de cada divisão)
CREATE TABLE IF NOT EXISTS pagamento_splits (
  id SERIAL PRIMARY KEY,
  pagamento_id INTEGER NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Valores
  valor_total INTEGER NOT NULL, -- Valor total da transação
  valor_plataforma INTEGER NOT NULL, -- Quanto ficou para a plataforma (R$ 5,00)
  valor_empresa INTEGER NOT NULL, -- Quanto foi para a empresa cliente

  -- Status do repasse
  status_repasse VARCHAR(20) DEFAULT 'pendente' CHECK(status_repasse IN ('pendente', 'processando', 'concluido', 'erro')),
  data_repasse TIMESTAMP,
  comprovante_repasse TEXT, -- ID da transação PIX ou comprovante

  -- Metadados
  chave_pix_destino TEXT NOT NULL, -- Para onde foi enviado
  erro_repasse TEXT, -- Se houver erro no repasse

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de uso (para analytics e billing)
CREATE TABLE IF NOT EXISTS empresa_metricas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Período
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,

  -- Métricas
  total_agendamentos INTEGER DEFAULT 0,
  total_receita INTEGER DEFAULT 0, -- Em centavos
  total_comissao_plataforma INTEGER DEFAULT 0,
  total_repasses INTEGER DEFAULT 0,

  -- Status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(empresa_id, mes, ano)
);

-- Tabela de configurações customizadas por empresa
CREATE TABLE IF NOT EXISTS empresa_configuracoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  chave VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(empresa_id, chave)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_splits_pagamento ON pagamento_splits(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_splits_empresa ON pagamento_splits(empresa_id);
CREATE INDEX IF NOT EXISTS idx_metricas_empresa ON empresa_metricas(empresa_id, ano, mes);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas;
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pagamento_splits_updated_at ON pagamento_splits;
CREATE TRIGGER update_pagamento_splits_updated_at
  BEFORE UPDATE ON pagamento_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir empresa demo (será a "matriz" ou empresa padrão)
INSERT INTO empresas (
  nome,
  slug,
  email,
  chave_pix,
  status
) VALUES (
  'Agenda Aqui Vistorias - Matriz',
  'matriz',
  'contato@agendaaquivistorias.com.br',
  'contato@agendaaquivistorias.com.br', -- Sua chave PIX
  'ativo'
) ON CONFLICT (slug) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE empresas IS 'Empresas clientes da plataforma SaaS';
COMMENT ON TABLE pagamento_splits IS 'Registro de divisão de pagamentos entre plataforma e empresa';
COMMENT ON TABLE empresa_metricas IS 'Métricas mensais de uso e faturamento por empresa';
COMMENT ON TABLE empresa_configuracoes IS 'Configurações customizadas por empresa';

COMMENT ON COLUMN empresas.slug IS 'Usado no subdomínio: {slug}.agendaaquivistorias.com.br';
COMMENT ON COLUMN empresas.percentual_plataforma IS 'Valor fixo em centavos que fica para a plataforma (default R$ 5,00)';
COMMENT ON COLUMN empresas.chave_pix IS 'Chave PIX do cliente para receber os repasses';
