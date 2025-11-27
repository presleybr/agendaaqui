-- =============================================
-- MIGRATION: Adicionar campos de personalização às empresas
-- =============================================

-- Adicionar colunas de personalização visual
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Coordenadas geográficas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Personalização visual
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS foto_capa_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(20) DEFAULT '#2563eb';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(20) DEFAULT '#1e40af';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(20) DEFAULT '#333333';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(20) DEFAULT '#ffffff';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS fonte_primaria VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) DEFAULT 'default';

-- Textos personalizados
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titulo_hero TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS subtitulo_hero TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS texto_sobre TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titulo_pagina VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Redes sociais e contato
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp_numero VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS site_url TEXT;

-- Horário de funcionamento como texto
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS horario_funcionamento TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS dias_trabalho VARCHAR(100);

-- Avaliações Google
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2, 1) DEFAULT 5.0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_avaliacoes BOOLEAN DEFAULT true;

-- Analytics
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(100);

-- Configurações de exibição
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_whatsapp_float BOOLEAN DEFAULT true;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mostrar_marca_propria BOOLEAN DEFAULT true;

-- Campos de pagamento
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS pix_type VARCHAR(20) DEFAULT 'cpf';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS percentual_plataforma INTEGER DEFAULT 500;

-- Data de início (para controle de comissão)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- TABELA: empresa_carrossel
-- Galeria de imagens para carrossel
-- =============================================
CREATE TABLE IF NOT EXISTS empresa_carrossel (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  imagem_url TEXT NOT NULL,
  titulo VARCHAR(255),
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_empresa_carrossel_empresa ON empresa_carrossel(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_carrossel_ordem ON empresa_carrossel(ordem);

-- =============================================
-- TABELA: templates
-- Templates de página para empresas
-- =============================================
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  preview_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir templates padrão
INSERT INTO templates (id, nome, descricao, ativo) VALUES
('default', 'Padrão', 'Template padrão do sistema', true),
('modern', 'Moderno', 'Design moderno e minimalista', true),
('classic', 'Clássico', 'Design tradicional e profissional', true),
('minimal', 'Minimalista', 'Design clean e simples', true)
ON CONFLICT (id) DO NOTHING;

-- Atualizar empresas existentes com valores padrão
UPDATE empresas SET
  cor_primaria = COALESCE(cor_primaria, '#2563eb'),
  cor_secundaria = COALESCE(cor_secundaria, '#1e40af'),
  template_id = COALESCE(template_id, 'default'),
  percentual_plataforma = COALESCE(percentual_plataforma, 500),
  data_inicio = COALESCE(data_inicio, data_cadastro, created_at)
WHERE cor_primaria IS NULL OR template_id IS NULL;
