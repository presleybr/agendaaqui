-- Migration: Integração com Asaas para repasses PIX automáticos
-- Data: 2025-12-26

-- Adicionar campos na tabela transacoes para dados do Asaas
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS pix_tipo VARCHAR(50);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS pix_ambiente VARCHAR(20);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS pix_detalhes TEXT;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS erro_mensagem TEXT;

-- Adicionar campos na tabela pagamentos para comprovante PIX
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS pix_comprovante VARCHAR(255);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_pix_txid ON transacoes(pix_txid);
CREATE INDEX IF NOT EXISTS idx_transacoes_pix_status ON transacoes(pix_status);
CREATE INDEX IF NOT EXISTS idx_transacoes_status_tipo ON transacoes(status, tipo);

-- Comentários
COMMENT ON COLUMN transacoes.pix_tipo IS 'Tipo de transferência: asaas_pix, simulado';
COMMENT ON COLUMN transacoes.pix_ambiente IS 'Ambiente: producao, sandbox, desenvolvimento';
COMMENT ON COLUMN transacoes.pix_detalhes IS 'JSON com detalhes da transferência Asaas';
COMMENT ON COLUMN transacoes.erro_mensagem IS 'Mensagem de erro em caso de falha';
COMMENT ON COLUMN pagamentos.pix_comprovante IS 'ID do comprovante de repasse PIX';
