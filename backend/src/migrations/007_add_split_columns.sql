-- Migration 007: Adiciona colunas de split na tabela pagamentos
-- Estas colunas são necessárias para o sistema de divisão de pagamentos

-- Colunas para controle do split
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_taxa INTEGER;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_empresa INTEGER;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS status_repasse VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS data_repasse TIMESTAMP;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS split_data JSONB;

-- Tabela de transações para histórico de repasses
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  pagamento_id INTEGER REFERENCES pagamentos(id) ON DELETE CASCADE,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,

  -- Tipo da transação
  tipo VARCHAR(20) NOT NULL CHECK(tipo IN ('taxa', 'repasse', 'estorno', 'ajuste')),

  -- Valores
  valor INTEGER NOT NULL, -- Em centavos

  -- Descrição
  descricao TEXT,

  -- PIX para repasses
  pix_key TEXT,
  pix_status VARCHAR(20) DEFAULT 'pendente',
  pix_txid TEXT,
  erro_mensagem TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pendente' CHECK(status IN ('pendente', 'processado', 'erro', 'cancelado')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_pagamento ON transacoes(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status_repasse ON pagamentos(status_repasse);

-- Comentários
COMMENT ON COLUMN pagamentos.valor_taxa IS 'Taxa cobrada pelo sistema (em centavos)';
COMMENT ON COLUMN pagamentos.valor_empresa IS 'Valor a ser repassado para a empresa (em centavos)';
COMMENT ON COLUMN pagamentos.status_repasse IS 'Status do repasse para a empresa';
COMMENT ON COLUMN pagamentos.data_repasse IS 'Data em que o repasse foi realizado';
COMMENT ON COLUMN pagamentos.split_data IS 'Dados completos do split em JSON';
COMMENT ON TABLE transacoes IS 'Histórico de todas as transações financeiras (taxas e repasses)';
