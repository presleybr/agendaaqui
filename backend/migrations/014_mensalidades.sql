-- =============================================
-- MIGRATION 014: Mensalidades das empresas
-- SaaS cobra assinatura mensal; PIX dos agendamentos vai 100% pra empresa.
-- =============================================

-- 1) Catalogo de planos
CREATE TABLE IF NOT EXISTS planos_mensalidade (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  preco_centavos INTEGER NOT NULL,
  limite_agendamentos_mes INTEGER,
  features JSONB DEFAULT '{}'::jsonb,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed inicial (idempotente)
INSERT INTO planos_mensalidade (nome, slug, preco_centavos, limite_agendamentos_mes, features, ordem)
VALUES
  ('Basic', 'basic', 4990, 50, '{"whatsapp":true,"dominio_personalizado":false,"suporte":"email"}'::jsonb, 1),
  ('Pro', 'pro', 9990, 200, '{"whatsapp":true,"dominio_personalizado":true,"suporte":"prioritario"}'::jsonb, 2),
  ('Unlimited', 'unlimited', 19990, NULL, '{"whatsapp":true,"dominio_personalizado":true,"suporte":"dedicado","relatorios_avancados":true}'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;

-- 2) Empresas: colunas de assinatura
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS plano_id INTEGER REFERENCES planos_mensalidade(id);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mensalidade_dia_vencimento INTEGER DEFAULT 10;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS em_carencia_ate DATE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mensalidade_status VARCHAR(20) DEFAULT 'em_dia';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mensalidade_isenta BOOLEAN DEFAULT false;

-- Atribuir plano Basic a empresas sem plano + carencia de 30 dias
UPDATE empresas
SET plano_id = (SELECT id FROM planos_mensalidade WHERE slug='basic'),
    em_carencia_ate = COALESCE(em_carencia_ate, CURRENT_DATE + INTERVAL '30 days'),
    mensalidade_status = COALESCE(mensalidade_status, 'em_dia')
WHERE plano_id IS NULL;

-- Nexus e isenta (dona da plataforma)
UPDATE empresas SET mensalidade_isenta = true, mensalidade_status = 'isenta' WHERE slug = 'nexus';

-- 3) Mensalidades (uma por empresa/mes)
CREATE TABLE IF NOT EXISTS mensalidades (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id INTEGER REFERENCES planos_mensalidade(id),
  competencia VARCHAR(7) NOT NULL,
  valor_centavos INTEGER NOT NULL,
  data_vencimento DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'pendente',
  pix_br_code TEXT,
  pix_qr_base64 TEXT,
  pix_txid VARCHAR(35),
  comprovante_url TEXT,
  comprovante_enviado_em TIMESTAMP,
  aprovado_em TIMESTAMP,
  aprovado_por VARCHAR(255),
  rejeitado_em TIMESTAMP,
  rejeicao_motivo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

CREATE INDEX IF NOT EXISTS idx_mensalidades_empresa ON mensalidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_competencia ON mensalidades(competencia);
CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento ON mensalidades(data_vencimento);

COMMIT;
