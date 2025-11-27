-- Migração para adicionar campos de personalização às empresas

-- Adicionar novas colunas à tabela empresas (se não existirem)
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS foto_capa_url TEXT,
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#1e40af',
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS site_url TEXT,
ADD COLUMN IF NOT EXISTS horario_funcionamento TEXT,
ADD COLUMN IF NOT EXISTS preco_cautelar INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_transferencia INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_outros INTEGER DEFAULT 0;

-- Criar tabela para imagens do carrossel das empresas
CREATE TABLE IF NOT EXISTS empresa_carrossel (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  imagem_url TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, ordem)
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_empresa_carrossel_empresa_id ON empresa_carrossel(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);

-- Criar tabela de templates/layouts
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  preview_url TEXT,
  configuracao JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir templates padrão
INSERT INTO templates (id, nome, descricao, preview_url, configuracao, ativo)
VALUES
  ('default', 'Template Padrão', 'Layout padrão com header, seção de serviços e agendamento', '/templates/previews/default.jpg',
   '{"header": "fixed", "hero": "image", "sections": ["services", "pricing", "testimonials", "scheduling"]}', true),
  ('modern', 'Template Moderno', 'Design minimalista e moderno com animações suaves', '/templates/previews/modern.jpg',
   '{"header": "transparent", "hero": "video", "sections": ["features", "pricing", "about", "scheduling"]}', true),
  ('classic', 'Template Clássico', 'Layout tradicional focado em informações', '/templates/previews/classic.jpg',
   '{"header": "static", "hero": "image", "sections": ["about", "services", "contact", "scheduling"]}', true),
  ('minimal', 'Template Minimalista', 'Design limpo com foco no agendamento', '/templates/previews/minimal.jpg',
   '{"header": "minimal", "hero": "none", "sections": ["scheduling", "pricing", "contact"]}', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar comentários nas tabelas
COMMENT ON TABLE empresas IS 'Empresas cadastradas no sistema com páginas personalizadas';
COMMENT ON TABLE empresa_carrossel IS 'Imagens do carrossel de fotos das empresas';
COMMENT ON TABLE templates IS 'Templates de layout disponíveis para as páginas das empresas';

COMMENT ON COLUMN empresas.slug IS 'Identificador único para URL da empresa (ex: /minhaempresa)';
COMMENT ON COLUMN empresas.template_id IS 'Template de layout escolhido pela empresa';
COMMENT ON COLUMN empresas.foto_capa_url IS 'URL da foto de capa/banner da empresa';
COMMENT ON COLUMN empresas.foto_perfil_url IS 'URL da foto de perfil/logo da empresa';
COMMENT ON COLUMN empresas.cor_primaria IS 'Cor primária em hexadecimal para tema da página';
COMMENT ON COLUMN empresas.cor_secundaria IS 'Cor secundária em hexadecimal para tema da página';
