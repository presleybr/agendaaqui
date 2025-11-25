-- Migration 006: Adiciona campos de personalização visual para empresas
-- Permite que cada empresa tenha sua própria identidade visual

-- Adicionar campos de personalização visual
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS whatsapp_numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,

-- Textos personalizados
ADD COLUMN IF NOT EXISTS titulo_hero TEXT,
ADD COLUMN IF NOT EXISTS subtitulo_hero TEXT,
ADD COLUMN IF NOT EXISTS texto_sobre TEXT,

-- Avaliações Google
ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0,

-- Personalização avançada
ADD COLUMN IF NOT EXISTS fonte_primaria VARCHAR(100) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(7) DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS mostrar_avaliacoes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_whatsapp_float BOOLEAN DEFAULT true,

-- Intervalo de agendamentos (já existe intervalo_minutos, mas vamos garantir)
ADD COLUMN IF NOT EXISTS intervalo_minutos INTEGER DEFAULT 60;

-- Comentários
COMMENT ON COLUMN empresas.banner_url IS 'URL da imagem de banner/hero da empresa';
COMMENT ON COLUMN empresas.favicon_url IS 'URL do favicon personalizado';
COMMENT ON COLUMN empresas.meta_pixel_id IS 'ID do Meta Pixel (Facebook) para tracking';
COMMENT ON COLUMN empresas.google_analytics_id IS 'ID do Google Analytics (GA4)';
COMMENT ON COLUMN empresas.whatsapp_numero IS 'Número WhatsApp com código do país (ex: 5567999999999)';
COMMENT ON COLUMN empresas.titulo_hero IS 'Título principal da página (Hero Section)';
COMMENT ON COLUMN empresas.subtitulo_hero IS 'Subtítulo da página (Hero Section)';
COMMENT ON COLUMN empresas.google_rating IS 'Nota média no Google (1.0 a 5.0)';
COMMENT ON COLUMN empresas.google_reviews_count IS 'Quantidade de avaliações no Google';
