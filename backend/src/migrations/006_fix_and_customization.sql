-- Migration 006: Correção de campos e adição de personalização visual
-- Esta migration garante compatibilidade entre schemas antigos e novos

-- =============================================
-- PARTE 1: Corrigir/Adicionar campos básicos na tabela empresas
-- =============================================

-- Adicionar campos se não existirem (compatibilidade com schema antigo)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS percentual_plataforma INTEGER DEFAULT 500;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS data_inicio DATE DEFAULT CURRENT_DATE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS dias_trabalho VARCHAR(20) DEFAULT '1,2,3,4,5,6';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Migrar dados do schema antigo para novo (se necessário)
-- Se existir comissao_fixa_reais mas não percentual_plataforma, copiar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'empresas' AND column_name = 'comissao_fixa_reais') THEN

    UPDATE empresas
    SET percentual_plataforma = comissao_fixa_reais
    WHERE percentual_plataforma IS NULL OR percentual_plataforma = 0;

  END IF;
END $$;

-- Se existir data_cadastro mas não data_inicio, copiar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'empresas' AND column_name = 'data_cadastro') THEN

    UPDATE empresas
    SET data_inicio = DATE(data_cadastro)
    WHERE data_inicio IS NULL;

  END IF;
END $$;

-- =============================================
-- PARTE 2: Criar tabela pagamento_splits se não existir
-- =============================================

CREATE TABLE IF NOT EXISTS pagamento_splits (
  id SERIAL PRIMARY KEY,
  pagamento_id INTEGER NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Valores
  valor_total INTEGER NOT NULL,
  valor_plataforma INTEGER NOT NULL,
  valor_empresa INTEGER NOT NULL,

  -- Status do repasse
  status_repasse VARCHAR(20) DEFAULT 'pendente' CHECK(status_repasse IN ('pendente', 'processando', 'concluido', 'erro')),
  data_repasse TIMESTAMP,
  comprovante_repasse TEXT,

  -- Metadados
  chave_pix_destino TEXT NOT NULL,
  erro_repasse TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para pagamento_splits
CREATE INDEX IF NOT EXISTS idx_splits_pagamento ON pagamento_splits(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_splits_empresa ON pagamento_splits(empresa_id);
CREATE INDEX IF NOT EXISTS idx_splits_status ON pagamento_splits(status_repasse);

-- =============================================
-- PARTE 3: Criar tabela empresa_metricas se não existir
-- =============================================

CREATE TABLE IF NOT EXISTS empresa_metricas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,

  total_agendamentos INTEGER DEFAULT 0,
  total_receita INTEGER DEFAULT 0,
  total_comissao_plataforma INTEGER DEFAULT 0,
  total_repasses INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(empresa_id, mes, ano)
);

CREATE INDEX IF NOT EXISTS idx_metricas_empresa ON empresa_metricas(empresa_id, ano, mes);

-- =============================================
-- PARTE 4: Adicionar campos de personalização visual
-- =============================================

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_numero VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Textos personalizados
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titulo_hero TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS subtitulo_hero TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS texto_sobre TEXT;

-- Avaliações Google
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1) DEFAULT 5.0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;

-- Personalização avançada
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS fonte_primaria VARCHAR(100) DEFAULT 'Inter';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(7) DEFAULT '#333333';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_avaliacoes BOOLEAN DEFAULT true;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_whatsapp_float BOOLEAN DEFAULT true;

-- Garantir que logo_url e cores existam (já existem na migration 005)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#1976d2';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#424242';

-- =============================================
-- PARTE 5: Triggers para updated_at
-- =============================================

-- Trigger para pagamento_splits
DROP TRIGGER IF EXISTS update_pagamento_splits_updated_at ON pagamento_splits;
CREATE TRIGGER update_pagamento_splits_updated_at
  BEFORE UPDATE ON pagamento_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para empresa_metricas
DROP TRIGGER IF EXISTS update_empresa_metricas_updated_at ON empresa_metricas;
CREATE TRIGGER update_empresa_metricas_updated_at
  BEFORE UPDATE ON empresa_metricas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PARTE 6: Comentários nas colunas
-- =============================================

COMMENT ON COLUMN empresas.percentual_plataforma IS 'Valor fixo em centavos que fica para a plataforma (default R$ 5,00)';
COMMENT ON COLUMN empresas.banner_url IS 'URL da imagem de banner/hero da empresa';
COMMENT ON COLUMN empresas.favicon_url IS 'URL do favicon personalizado';
COMMENT ON COLUMN empresas.meta_pixel_id IS 'ID do Meta Pixel (Facebook) para tracking';
COMMENT ON COLUMN empresas.google_analytics_id IS 'ID do Google Analytics (GA4)';
COMMENT ON COLUMN empresas.whatsapp_numero IS 'Número WhatsApp com código do país (ex: 5567999999999)';
COMMENT ON COLUMN empresas.titulo_hero IS 'Título principal da página (Hero Section)';
COMMENT ON COLUMN empresas.subtitulo_hero IS 'Subtítulo da página (Hero Section)';
COMMENT ON COLUMN empresas.google_rating IS 'Nota média no Google (1.0 a 5.0)';
COMMENT ON COLUMN empresas.google_reviews_count IS 'Quantidade de avaliações no Google';

COMMENT ON TABLE pagamento_splits IS 'Registro de divisão de pagamentos entre plataforma e empresa';
COMMENT ON TABLE empresa_metricas IS 'Métricas mensais de uso e faturamento por empresa';

-- =============================================
-- FIM DA MIGRATION
-- =============================================

-- Mostrar estrutura final da tabela empresas
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'empresas'
ORDER BY ordinal_position;
