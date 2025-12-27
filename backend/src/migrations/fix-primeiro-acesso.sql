-- Migration: Fix primeiro_acesso for existing users
-- Run this once to fix users who were created before the registration fix

-- Update all users who have primeiro_acesso = true to false
-- (assuming they already have a password set)
UPDATE usuarios_empresa
SET primeiro_acesso = false, updated_at = CURRENT_TIMESTAMP
WHERE primeiro_acesso = true
  AND senha_hash IS NOT NULL
  AND senha_hash != '';

-- Show how many were updated
SELECT 'Users updated' as status, COUNT(*) as count
FROM usuarios_empresa
WHERE primeiro_acesso = false;
