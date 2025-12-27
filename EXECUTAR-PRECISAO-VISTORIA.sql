-- =============================================
-- CRIAR EMPRESA: Precisão Vistoria
-- Email: precisaovistoria@gmail.com
-- Senha: 123456
-- =============================================
-- Execute este script no Render Dashboard > PostgreSQL > PSQL Shell
-- Ou via Render Shell: psql $DATABASE_URL -f este-arquivo.sql

BEGIN;

-- 1. Criar empresa
INSERT INTO empresas (nome, slug, email, telefone, whatsapp, cidade, estado, status, cor_primaria, cor_secundaria)
VALUES ('Precisão Vistoria', 'precisao-vistoria', 'precisaovistoria@gmail.com', '', '', '', '', 'ativo', '#2563eb', '#1e40af')
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  status = 'ativo'
RETURNING id, nome, slug;

-- 2. Criar usuário admin (senha: 123456)
-- Hash bcrypt gerado para '123456': $2a$10$PV14CJEbNUpXltB3iaRVYuYlVfiYL6JsOM1aEMLKlfpSLY94Qr/wO
INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
SELECT
  id,
  'Administrador Precisão Vistoria',
  'precisaovistoria@gmail.com',
  '$2a$10$PV14CJEbNUpXltB3iaRVYuYlVfiYL6JsOM1aEMLKlfpSLY94Qr/wO',
  'admin',
  true,
  true
FROM empresas
WHERE slug = 'precisao-vistoria'
ON CONFLICT (email) DO UPDATE SET
  senha_hash = '$2a$10$PV14CJEbNUpXltB3iaRVYuYlVfiYL6JsOM1aEMLKlfpSLY94Qr/wO',
  empresa_id = EXCLUDED.empresa_id,
  ativo = true;

COMMIT;

-- Verificar criação
SELECT
  e.id as empresa_id,
  e.nome as empresa_nome,
  e.slug,
  e.status,
  u.id as usuario_id,
  u.email as usuario_email,
  u.role
FROM empresas e
LEFT JOIN usuarios_empresa u ON u.empresa_id = e.id
WHERE e.slug = 'precisao-vistoria';

-- =============================================
-- RESULTADO ESPERADO:
-- =============================================
-- empresa_id | empresa_nome      | slug              | status | usuario_id | usuario_email              | role
-- -----------+-------------------+-------------------+--------+------------+----------------------------+-------
--          X | Precisão Vistoria | precisao-vistoria | ativo  |          Y | precisaovistoria@gmail.com | admin
--
-- ACESSO:
-- URL: https://agendaaquivistorias.com.br/precisao-vistoria
-- Painel: https://agendaaquivistorias.com.br/painel-empresa.html
-- Email: precisaovistoria@gmail.com
-- Senha: 123456
-- =============================================
