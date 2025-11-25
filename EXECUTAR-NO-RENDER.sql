-- ================================================================
-- SCRIPT PARA EXECUTAR NO RENDER SQL EDITOR
-- ================================================================
--
-- Como executar:
-- 1. Acesse: https://dashboard.render.com
-- 2. Selecione seu PostgreSQL database
-- 3. Clique em "SQL Editor" ou "Connect" → "External Connection"
-- 4. Cole este SQL completo e execute
--
-- ================================================================

-- PASSO 1: Adicionar campos de personalização na tabela empresas
-- ================================================================

-- Campos de personalização visual
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#1976d2';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#424242';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(7) DEFAULT '#333333';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS fonte_primaria VARCHAR(100) DEFAULT 'Inter';

-- Textos personalizados
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titulo_hero TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS subtitulo_hero TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS texto_sobre TEXT;

-- Contato e redes sociais
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_numero VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Avaliações Google
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1) DEFAULT 5.0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_avaliacoes BOOLEAN DEFAULT true;

-- Analytics
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(50);

-- Configurações de exibição
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_whatsapp_float BOOLEAN DEFAULT true;

-- Campos do sistema (se não existirem)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS percentual_plataforma INTEGER DEFAULT 500;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS data_inicio DATE DEFAULT CURRENT_DATE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS intervalo_minutos INTEGER DEFAULT 60;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS dias_trabalho VARCHAR(20) DEFAULT '1,2,3,4,5,6';

-- PASSO 2: Criar tabelas de splits e métricas
-- ================================================================

CREATE TABLE IF NOT EXISTS pagamento_splits (
  id SERIAL PRIMARY KEY,
  pagamento_id INTEGER NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  valor_total INTEGER NOT NULL,
  valor_plataforma INTEGER NOT NULL,
  valor_empresa INTEGER NOT NULL,
  status_repasse VARCHAR(20) DEFAULT 'pendente' CHECK(status_repasse IN ('pendente', 'processando', 'concluido', 'erro')),
  data_repasse TIMESTAMP,
  comprovante_repasse TEXT,
  chave_pix_destino TEXT NOT NULL,
  erro_repasse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_splits_pagamento ON pagamento_splits(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_splits_empresa ON pagamento_splits(empresa_id);
CREATE INDEX IF NOT EXISTS idx_splits_status ON pagamento_splits(status_repasse);
CREATE INDEX IF NOT EXISTS idx_metricas_empresa ON empresa_metricas(empresa_id, ano, mes);

-- PASSO 3: Criar empresas de exemplo
-- ================================================================

-- Empresa 1: vistoriapremium
INSERT INTO empresas (
  nome, slug, email, telefone, chave_pix, status, plano,
  preco_cautelar, preco_transferencia, preco_outros,
  horario_inicio, horario_fim, intervalo_minutos,
  cor_primaria, cor_secundaria, cor_texto, cor_fundo,
  titulo_hero, subtitulo_hero,
  google_rating, google_reviews_count, mostrar_avaliacoes,
  whatsapp_numero, mostrar_whatsapp_float,
  percentual_plataforma, data_inicio
) VALUES (
  'Vistoria Premium',
  'vistoriapremium',
  'contato@vistoriapremium.com.br',
  '(67) 99999-9999',
  'contato@vistoriapremium.com.br',
  'ativo',
  'premium',
  15000, 12000, 10000,
  '08:00:00', '18:00:00', 60,
  '#1976d2', '#424242', '#333333', '#ffffff',
  'Vistoria Premium - Excelência em Vistorias Veiculares',
  'Agende sua vistoria com os melhores profissionais do mercado',
  5.0, 150, true,
  '5567999999999', true,
  500, CURRENT_DATE
)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  telefone = EXCLUDED.telefone,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

-- Empresa 2: criar
INSERT INTO empresas (
  nome, slug, email, telefone, chave_pix, status, plano,
  preco_cautelar, preco_transferencia, preco_outros,
  horario_inicio, horario_fim, intervalo_minutos,
  cor_primaria, cor_secundaria,
  titulo_hero, subtitulo_hero,
  google_rating, google_reviews_count,
  whatsapp_numero,
  percentual_plataforma, data_inicio
) VALUES (
  'Criar Vistorias',
  'criar',
  'contato@criar.com.br',
  '(67) 98888-8888',
  'contato@criar.com.br',
  'ativo',
  'basico',
  15000, 12000, 10000,
  '08:00:00', '18:00:00', 60,
  '#FF5722', '#212121',
  'Criar Vistorias - Sua Vistoria Agora!',
  'Rápido, fácil e com o melhor atendimento',
  4.9, 200,
  '5567988888888',
  500, CURRENT_DATE
)
ON CONFLICT (slug) DO NOTHING;

-- PASSO 4: Verificar se tudo foi criado
-- ================================================================

-- Verificar campos novos
SELECT
  COUNT(*) as total_campos_novos
FROM information_schema.columns
WHERE table_name = 'empresas'
AND column_name IN (
  'logo_url', 'banner_url', 'favicon_url',
  'cor_primaria', 'titulo_hero', 'whatsapp_numero'
);
-- Deve retornar: 6

-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pagamento_splits', 'empresa_metricas')
ORDER BY table_name;
-- Deve retornar: empresa_metricas, pagamento_splits

-- Listar empresas criadas
SELECT
  id,
  nome,
  slug,
  email,
  status,
  COALESCE(cor_primaria, 'SEM COR') as cor,
  COALESCE(titulo_hero, 'SEM TITULO') as titulo
FROM empresas
ORDER BY created_at DESC;

-- ================================================================
-- FIM DO SCRIPT
-- ================================================================
--
-- ✅ Se executou sem erros, o sistema está pronto!
--
-- Próximos passos:
-- 1. Acesse: https://agendaaquivistorias.com.br/vistoriapremium
-- 2. Acesse: https://agendaaquivistorias.com.br/criar
-- 3. Crie novas empresas em: https://agendaaquivistorias.com.br/admin
--
-- ================================================================
