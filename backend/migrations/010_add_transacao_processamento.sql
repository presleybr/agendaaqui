-- Migration 010: Adiciona campo data_processamento na tabela transacoes
-- Este campo é usado para registrar quando a transação foi processada

-- Adiciona coluna data_processamento se não existir
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS data_processamento TIMESTAMP;

-- Comentário
COMMENT ON COLUMN transacoes.data_processamento IS 'Data em que a transação foi processada/confirmada';

-- Índice para buscar transações por data de processamento
CREATE INDEX IF NOT EXISTS idx_transacoes_data_processamento ON transacoes(data_processamento);
