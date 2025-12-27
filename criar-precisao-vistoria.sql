-- Script para criar empresa Precisão Vistoria
-- Execute no Render Shell ou pgAdmin

-- 1. Criar empresa
INSERT INTO empresas (nome, slug, email, telefone, whatsapp, cidade, estado, status, cor_primaria, cor_secundaria)
VALUES ('Precisão Vistoria', 'precisao-vistoria', 'precisaovistoria@gmail.com', '', '', '', '', 'ativo', '#2563eb', '#1e40af')
ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
RETURNING id;

-- 2. Criar usuário admin (senha: 123456)
-- O hash bcrypt para '123456' é: $2a$10$PV14CJEbNUpXltB3iaRVYuYlVfiYL6JsOM1aEMLKlfpSLY94Qr/wO
INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
SELECT id, 'Administrador Precisão Vistoria', 'precisaovistoria@gmail.com', '$2a$10$PV14CJEbNUpXltB3iaRVYuYlVfiYL6JsOM1aEMLKlfpSLY94Qr/wO', 'admin', true, true
FROM empresas WHERE slug = 'precisao-vistoria'
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  empresa_id = EXCLUDED.empresa_id;

-- Verificar criação
SELECT e.id, e.nome, e.slug, e.email, u.email as usuario_email, u.role
FROM empresas e
LEFT JOIN usuarios_empresa u ON u.empresa_id = e.id
WHERE e.slug = 'precisao-vistoria';
