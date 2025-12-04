-- Migration 009: Corrige schema da tabela pagamentos
-- Adiciona colunas que podem estar faltando para compatibilidade

-- Adiciona coluna tipo_pagamento se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(20);

-- Adiciona coluna valor se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor INTEGER;

-- Adiciona coluna qr_code se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Adiciona coluna qr_code_base64 se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;

-- Adiciona coluna dados_pagamento se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS dados_pagamento TEXT;

-- Adiciona coluna data_pagamento se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP;

-- Adiciona coluna installments se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;

-- Adiciona coluna payment_method_id se não existir
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR(50);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_payment_id ON pagamentos(mp_payment_id);
