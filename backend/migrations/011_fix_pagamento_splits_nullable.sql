-- Migration 011: Permitir chave_pix_destino como NULL em pagamento_splits
-- Isso permite registrar splits mesmo quando a empresa ainda não configurou PIX

ALTER TABLE pagamento_splits ALTER COLUMN chave_pix_destino DROP NOT NULL;
