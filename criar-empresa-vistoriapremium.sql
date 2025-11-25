-- Script para criar empresa Vistoria Premium
-- Execute este SQL no banco de dados do Render

-- 1. Criar a empresa
INSERT INTO empresas (
  nome,
  slug,
  email,
  telefone,
  chave_pix,
  status,
  plano,

  -- Preços (em centavos)
  preco_cautelar,
  preco_transferencia,
  preco_outros,

  -- Horários
  horario_inicio,
  horario_fim,
  intervalo_minutos,

  -- Personalização visual
  cor_primaria,
  cor_secundaria,
  cor_texto,
  cor_fundo,

  -- Textos personalizados
  titulo_hero,
  subtitulo_hero,

  -- Avaliações
  google_rating,
  google_reviews_count,
  mostrar_avaliacoes,

  -- WhatsApp
  whatsapp_numero,
  mostrar_whatsapp_float,

  -- Split de pagamento
  percentual_plataforma,
  data_inicio

) VALUES (
  'Vistoria Premium', -- nome
  'vistoriapremium', -- slug (IMPORTANTE: sem espaços, lowercase)
  'contato@vistoriapremium.com.br', -- email
  '(67) 99999-9999', -- telefone
  'contato@vistoriapremium.com.br', -- chave_pix (OBRIGATÓRIO para repasses)
  'ativo', -- status
  'premium', -- plano

  -- Preços (R$ 150,00 / R$ 120,00 / R$ 100,00)
  15000,
  12000,
  10000,

  -- Horários (8h às 18h, intervalos de 60 min)
  '08:00:00',
  '18:00:00',
  60,

  -- Cores (exemplo: azul premium)
  '#1976d2', -- primária
  '#424242', -- secundária
  '#333333', -- texto
  '#ffffff', -- fundo

  -- Textos
  'Vistoria Premium - Excelência em Vistorias Veiculares',
  'Agende sua vistoria com os melhores profissionais do mercado',

  -- Avaliações
  5.0,
  150,
  true,

  -- WhatsApp (formato: código país + DDD + número)
  '5567999999999',
  true,

  -- Split (R$ 5,00 = 500 centavos)
  500,
  CURRENT_DATE
)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  telefone = EXCLUDED.telefone,
  chave_pix = EXCLUDED.chave_pix,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Verificar se foi criada
SELECT
  id,
  nome,
  slug,
  email,
  status,
  chave_pix,
  preco_cautelar / 100.0 as preco_cautelar_reais,
  cor_primaria,
  titulo_hero
FROM empresas
WHERE slug = 'vistoriapremium';

-- 3. Listar todas as empresas
SELECT id, nome, slug, status, email
FROM empresas
ORDER BY created_at DESC;
