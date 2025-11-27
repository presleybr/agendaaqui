-- Migration: Sistema de usuários para empresas (Painel CRM)
-- Data: 2024
-- Descrição: Cria tabelas para autenticação e gestão de usuários das empresas clientes

-- ============================================
-- TABELA: usuarios_empresa
-- Usuários que podem acessar o painel de cada empresa
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios_empresa (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- admin, gerente, atendente, visualizador
  ativo BOOLEAN DEFAULT true,
  primeiro_acesso BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_email ON usuarios_empresa(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_empresa_id ON usuarios_empresa(empresa_id);

-- ============================================
-- TABELA: sessoes_empresa
-- Controle de sessões ativas (para invalidar tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS sessoes_empresa (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios_empresa(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_empresa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expires ON sessoes_empresa(expires_at);

-- ============================================
-- TABELA: log_atividades_empresa
-- Registro de ações realizadas no painel
-- ============================================
CREATE TABLE IF NOT EXISTS log_atividades_empresa (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios_empresa(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL,
  descricao TEXT,
  dados_extras JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_log_empresa ON log_atividades_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_log_usuario ON log_atividades_empresa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_acao ON log_atividades_empresa(acao);
CREATE INDEX IF NOT EXISTS idx_log_created ON log_atividades_empresa(created_at);

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE usuarios_empresa IS 'Usuários que podem acessar o painel CRM de cada empresa';
COMMENT ON COLUMN usuarios_empresa.role IS 'Níveis: admin (tudo), gerente (sem config), atendente (só agendamentos), visualizador (só leitura)';
COMMENT ON COLUMN usuarios_empresa.primeiro_acesso IS 'True = usuário deve alterar senha no primeiro login';

COMMENT ON TABLE sessoes_empresa IS 'Controle de sessões ativas para invalidação de tokens';
COMMENT ON TABLE log_atividades_empresa IS 'Auditoria de ações realizadas no painel da empresa';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration executada com sucesso!';
  RAISE NOTICE 'Tabelas criadas: usuarios_empresa, sessoes_empresa, log_atividades_empresa';
END $$;
