-- =============================================
-- SCRIPT DE RESET E MIGRAÇÃO COMPLETA
-- Execute via psql do Render para resetar o banco
-- =============================================

-- Resetar schema (CUIDADO: Apaga todos os dados!)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Mensagem de confirmação
\echo '✅ Schema resetado com sucesso!'
\echo '📝 Agora execute a migração:'
\echo '   cd backend && node migrate-postgres.js'
\echo ''
\echo 'OU faça deploy manual no Render que executará automaticamente.'
