-- =============================================
-- MIGRATION 013: PIX Manual (Copia e Cola offline, sem API)
-- =============================================

-- 1) Empresas: nome do titular (aparece no QR como Merchant Name)
-- Chave em si já existe em "chave_pix" e tipo em "pix_type".
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS pix_titular VARCHAR(25);

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS pix_manual_ativo BOOLEAN DEFAULT true;

-- 2) Pagamentos: campos do PIX manual
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS pix_br_code TEXT;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS pix_qr_base64 TEXT;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS pix_txid VARCHAR(35);

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS comprovante_enviado_em TIMESTAMP;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS aprovado_por VARCHAR(255);

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS rejeitado_em TIMESTAMP;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS rejeicao_motivo TEXT;

CREATE INDEX IF NOT EXISTS idx_pagamentos_pix_txid ON pagamentos(pix_txid);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- 3) Agendamentos: colunas que o codigo ja referencia mas nao existiam
ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS endereco_vistoria TEXT;

ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS pagamento_confirmado BOOLEAN DEFAULT false;

-- 4) Nexus: chave aleatoria fixa (empresa dona da plataforma)
UPDATE empresas
SET chave_pix = '974c2ff6-a51b-4efb-91de-8821cbf3f0a4',
    pix_type = 'aleatoria',
    pix_titular = COALESCE(pix_titular, 'NEXUS VISTORIAS')
WHERE slug = 'nexus';

COMMIT;
