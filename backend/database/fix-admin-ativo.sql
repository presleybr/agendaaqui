-- =============================================
-- FIX: Ativar Super Admin
-- Execute este script no Render para ativar o super admin
-- =============================================

-- Ativar o super admin existente
UPDATE usuarios_admin
SET ativo = true
WHERE email = 'admin@vistoria.com';

-- Verificar resultado
SELECT id, nome, email, ativo, created_at
FROM usuarios_admin
WHERE email = 'admin@vistoria.com';
