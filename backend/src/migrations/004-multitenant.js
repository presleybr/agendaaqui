const db = require('../config/database');

const usePostgres = !!process.env.DATABASE_URL;

async function up() {
  console.log('Executando migration 004-multitenant...');

  if (usePostgres) {
    // PostgreSQL
    await db.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        razao_social VARCHAR(255),
        cnpj VARCHAR(18),
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        pix_key VARCHAR(255) NOT NULL,
        pix_type VARCHAR(20) NOT NULL,
        logo_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'ativo',
        data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios_admin (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'ativo',
        ultimo_acesso TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id),
        pagamento_id INTEGER REFERENCES pagamentos(id),
        agendamento_id INTEGER REFERENCES agendamentos(id),
        tipo VARCHAR(50) NOT NULL,
        valor INTEGER NOT NULL,
        descricao TEXT,
        pix_key VARCHAR(255),
        pix_txid VARCHAR(255),
        pix_status VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pendente',
        data_processamento TIMESTAMP,
        erro_mensagem TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar colunas nas tabelas existentes
    try {
      await db.query(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id)`);
    } catch (e) {
      console.log('Coluna empresa_id já existe em agendamentos');
    }

    try {
      await db.query(`ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id)`);
      await db.query(`ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_taxa INTEGER DEFAULT 0`);
      await db.query(`ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_empresa INTEGER DEFAULT 0`);
      await db.query(`ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS status_repasse VARCHAR(50) DEFAULT 'pendente'`);
      await db.query(`ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS data_repasse TIMESTAMP`);
      await db.query(`ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS split_data TEXT`);
    } catch (e) {
      console.log('Colunas já existem em pagamentos');
    }

    // Inserir configurações do sistema
    await db.query(`
      INSERT INTO configuracoes (chave, valor, descricao)
      VALUES
        ('taxa_inicial', '500', 'Taxa cobrada nos primeiros 30 dias (em centavos) - R$ 5,00'),
        ('taxa_apos_30_dias', '700', 'Taxa cobrada após 30 dias (em centavos) - R$ 7,00'),
        ('dias_taxa_inicial', '30', 'Número de dias para aplicar taxa inicial'),
        ('pix_sistema_key', '', 'Chave PIX do sistema para receber pagamentos'),
        ('pix_sistema_type', 'email', 'Tipo da chave PIX do sistema')
      ON CONFLICT (chave) DO NOTHING
    `);

    // Criar índices
    await db.query(`CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_transacoes_pagamento ON transacoes(pagamento_id)`);

  } else {
    // SQLite
    db.exec(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        razao_social VARCHAR(255),
        cnpj VARCHAR(18),
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        pix_key VARCHAR(255) NOT NULL,
        pix_type VARCHAR(20) NOT NULL,
        logo_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'ativo',
        data_inicio DATE NOT NULL DEFAULT (date('now')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios_admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'ativo',
        ultimo_acesso TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id),
        pagamento_id INTEGER REFERENCES pagamentos(id),
        agendamento_id INTEGER REFERENCES agendamentos(id),
        tipo VARCHAR(50) NOT NULL,
        valor INTEGER NOT NULL,
        descricao TEXT,
        pix_key VARCHAR(255),
        pix_txid VARCHAR(255),
        pix_status VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pendente',
        data_processamento TIMESTAMP,
        erro_mensagem TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Para SQLite, precisamos verificar se as colunas já existem antes de adicionar
    const agendamentosInfo = db.prepare("PRAGMA table_info(agendamentos)").all();
    if (!agendamentosInfo.find(col => col.name === 'empresa_id')) {
      db.exec(`ALTER TABLE agendamentos ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)`);
    }

    const pagamentosInfo = db.prepare("PRAGMA table_info(pagamentos)").all();
    if (!pagamentosInfo.find(col => col.name === 'empresa_id')) {
      db.exec(`ALTER TABLE pagamentos ADD COLUMN empresa_id INTEGER`);
      db.exec(`ALTER TABLE pagamentos ADD COLUMN valor_taxa INTEGER DEFAULT 0`);
      db.exec(`ALTER TABLE pagamentos ADD COLUMN valor_empresa INTEGER DEFAULT 0`);
      db.exec(`ALTER TABLE pagamentos ADD COLUMN status_repasse VARCHAR(50) DEFAULT 'pendente'`);
      db.exec(`ALTER TABLE pagamentos ADD COLUMN data_repasse TIMESTAMP`);
      db.exec(`ALTER TABLE pagamentos ADD COLUMN split_data TEXT`);
    }

    // Inserir configurações
    db.exec(`
      INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
      ('taxa_inicial', '500', 'Taxa cobrada nos primeiros 30 dias (em centavos) - R$ 5,00'),
      ('taxa_apos_30_dias', '700', 'Taxa cobrada após 30 dias (em centavos) - R$ 7,00'),
      ('dias_taxa_inicial', '30', 'Número de dias para aplicar taxa inicial'),
      ('pix_sistema_key', '', 'Chave PIX do sistema para receber pagamentos'),
      ('pix_sistema_type', 'email', 'Tipo da chave PIX do sistema')
    `);

    // Criar índices
    db.exec(`CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transacoes_pagamento ON transacoes(pagamento_id)`);
  }

  console.log('Migration 004-multitenant concluída!');
}

async function down() {
  console.log('Revertendo migration 004-multitenant...');

  if (usePostgres) {
    await db.query(`DROP TABLE IF EXISTS transacoes CASCADE`);
    await db.query(`DROP TABLE IF EXISTS usuarios_admin CASCADE`);
    await db.query(`DROP TABLE IF EXISTS empresas CASCADE`);
  } else {
    db.exec(`DROP TABLE IF EXISTS transacoes`);
    db.exec(`DROP TABLE IF EXISTS usuarios_admin`);
    db.exec(`DROP TABLE IF EXISTS empresas`);
  }

  console.log('Migration 004-multitenant revertida!');
}

module.exports = { up, down };
