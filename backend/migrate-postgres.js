require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

/**
 * Migration segura para produção.
 * Usa CREATE TABLE IF NOT EXISTS e ALTER TABLE ADD COLUMN IF NOT EXISTS.
 * Pode ser executada múltiplas vezes sem perda de dados (idempotente).
 */
const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL nao configurada!');
    console.error('Configure a variavel de ambiente DATABASE_URL no arquivo .env');
    console.error('Exemplo: DATABASE_URL=postgresql://usuario:senha@localhost:5432/agendaaqui');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  try {
    console.log('Iniciando migration segura para PostgreSQL...\n');
    console.log('Ambiente:', process.env.NODE_ENV || 'development');

    await client.query('BEGIN');

    // =============================================
    // TABELA: usuarios_admin
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios_admin (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela usuarios_admin');

    // =============================================
    // TABELA: empresas
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        cnpj VARCHAR(18),
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        chave_pix TEXT NOT NULL DEFAULT '',
        percentual_plataforma INTEGER DEFAULT 500,
        logo_url TEXT,
        cor_primaria VARCHAR(7) DEFAULT '#1976d2',
        cor_secundaria VARCHAR(7) DEFAULT '#424242',
        preco_cautelar INTEGER DEFAULT 15000,
        preco_transferencia INTEGER DEFAULT 12000,
        preco_outros INTEGER DEFAULT 10000,
        horario_inicio TIME DEFAULT '08:00',
        horario_fim TIME DEFAULT '18:00',
        dias_trabalho VARCHAR(20) DEFAULT '1,2,3,4,5,6',
        status VARCHAR(20) DEFAULT 'ativo',
        plano VARCHAR(50) DEFAULT 'basico',
        data_inicio DATE DEFAULT CURRENT_DATE,
        data_fim DATE,
        endereco TEXT,
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cep VARCHAR(9),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela empresas');

    // =============================================
    // TABELA: configuracoes
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        chave VARCHAR(100) NOT NULL,
        valor TEXT,
        tipo VARCHAR(20) DEFAULT 'string',
        descricao TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela configuracoes');

    // =============================================
    // TABELA: clientes
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(14),
        email VARCHAR(255),
        telefone VARCHAR(20),
        endereco TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela clientes');

    // =============================================
    // TABELA: veiculos
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        placa VARCHAR(10) NOT NULL,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        ano INTEGER,
        cor VARCHAR(50),
        chassi VARCHAR(50),
        renavam VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela veiculos');

    // =============================================
    // TABELA: agendamentos
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
        veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
        protocolo VARCHAR(20) UNIQUE NOT NULL,
        data_hora TIMESTAMP NOT NULL,
        tipo_vistoria VARCHAR(50) NOT NULL,
        valor INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        status_pagamento VARCHAR(20) DEFAULT 'pendente',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela agendamentos');

    // =============================================
    // TABELA: pagamentos
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,
        mp_payment_id VARCHAR(100),
        mp_preference_id VARCHAR(100),
        valor_total INTEGER NOT NULL,
        valor_empresa INTEGER,
        valor_comissao INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        metodo_pagamento VARCHAR(50),
        pago_em TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela pagamentos');

    // =============================================
    // TABELA: transacoes
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        pagamento_id INTEGER REFERENCES pagamentos(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        valor INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        processado_em TIMESTAMP,
        comprovante TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela transacoes');

    // =============================================
    // TABELA: notificacoes
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        mensagem TEXT NOT NULL,
        lida BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela notificacoes');

    // =============================================
    // TABELA: horarios_bloqueados
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS horarios_bloqueados (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        horario_inicio TIME,
        horario_fim TIME,
        motivo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela horarios_bloqueados');

    // =============================================
    // TABELA: pagamento_splits
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamento_splits (
        id SERIAL PRIMARY KEY,
        pagamento_id INTEGER NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        valor_total INTEGER NOT NULL,
        valor_plataforma INTEGER NOT NULL,
        valor_empresa INTEGER NOT NULL,
        status_repasse VARCHAR(20) DEFAULT 'pendente',
        data_repasse TIMESTAMP,
        comprovante_repasse TEXT,
        chave_pix_destino TEXT NOT NULL,
        erro_repasse TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Tabela pagamento_splits');

    // =============================================
    // TABELA: empresa_metricas
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresa_metricas (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        total_agendamentos INTEGER DEFAULT 0,
        total_receita INTEGER DEFAULT 0,
        total_comissao_plataforma INTEGER DEFAULT 0,
        total_repasses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(empresa_id, mes, ano)
      )
    `);
    console.log('[OK] Tabela empresa_metricas');

    // =============================================
    // TABELA: empresa_configuracoes
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresa_configuracoes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        chave VARCHAR(100) NOT NULL,
        valor TEXT NOT NULL,
        descricao TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(empresa_id, chave)
      )
    `);
    console.log('[OK] Tabela empresa_configuracoes');

    await client.query('COMMIT');
    console.log('\n[OK] Todas as tabelas criadas/verificadas com sucesso!\n');

    // =============================================
    // ADICIONAR COLUNAS EXTRAS (ALTER TABLE)
    // Executadas fora da transacao para evitar erros
    // =============================================
    console.log('Adicionando colunas extras se necessario...\n');

    const addColumnSafe = async (table, column, definition) => {
      try {
        await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
      } catch (e) {
        // Ignora erro se coluna ja existe
      }
    };

    // Colunas de personalizacao na tabela empresas
    await addColumnSafe('empresas', 'banner_url', 'TEXT');
    await addColumnSafe('empresas', 'favicon_url', 'TEXT');
    await addColumnSafe('empresas', 'meta_pixel_id', 'VARCHAR(50)');
    await addColumnSafe('empresas', 'google_analytics_id', 'VARCHAR(50)');
    await addColumnSafe('empresas', 'whatsapp_numero', 'VARCHAR(20)');
    await addColumnSafe('empresas', 'facebook_url', 'TEXT');
    await addColumnSafe('empresas', 'instagram_url', 'TEXT');
    await addColumnSafe('empresas', 'linkedin_url', 'TEXT');
    await addColumnSafe('empresas', 'website_url', 'TEXT');
    await addColumnSafe('empresas', 'titulo_hero', 'TEXT');
    await addColumnSafe('empresas', 'subtitulo_hero', 'TEXT');
    await addColumnSafe('empresas', 'texto_sobre', 'TEXT');
    await addColumnSafe('empresas', 'google_rating', 'DECIMAL(2,1) DEFAULT 5.0');
    await addColumnSafe('empresas', 'google_reviews_count', 'INTEGER DEFAULT 0');
    await addColumnSafe('empresas', 'fonte_primaria', "VARCHAR(100) DEFAULT 'Inter'");
    await addColumnSafe('empresas', 'cor_texto', "VARCHAR(7) DEFAULT '#333333'");
    await addColumnSafe('empresas', 'cor_fundo', "VARCHAR(7) DEFAULT '#ffffff'");
    await addColumnSafe('empresas', 'mostrar_avaliacoes', 'BOOLEAN DEFAULT true');
    await addColumnSafe('empresas', 'mostrar_whatsapp_float', 'BOOLEAN DEFAULT true');
    await addColumnSafe('empresas', 'intervalo_minutos', 'INTEGER DEFAULT 60');

    // Colunas empresa_id em tabelas que podem nao ter (compatibilidade)
    await addColumnSafe('horarios_bloqueados', 'empresa_id', 'INTEGER REFERENCES empresas(id) ON DELETE CASCADE');

    console.log('[OK] Colunas extras verificadas\n');

    // =============================================
    // INDICES
    // =============================================
    console.log('Criando indices...\n');

    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin(email)',
      'CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug)',
      'CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status)',
      'CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa ON configuracoes(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf)',
      'CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone)',
      'CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_id)',
      'CREATE INDEX IF NOT EXISTS idx_veiculos_empresa ON veiculos(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa)',
      'CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id)',
      'CREATE INDEX IF NOT EXISTS idx_agendamentos_protocolo ON agendamentos(protocolo)',
      'CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_hora)',
      'CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status)',
      'CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento ON pagamentos(agendamento_id)',
      'CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_id ON pagamentos(mp_payment_id)',
      'CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo)',
      'CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status)',
      'CREATE INDEX IF NOT EXISTS idx_notificacoes_empresa ON notificacoes(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida)',
      'CREATE INDEX IF NOT EXISTS idx_horarios_bloqueados_data ON horarios_bloqueados(data)',
      'CREATE INDEX IF NOT EXISTS idx_splits_pagamento ON pagamento_splits(pagamento_id)',
      'CREATE INDEX IF NOT EXISTS idx_splits_empresa ON pagamento_splits(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_splits_status ON pagamento_splits(status_repasse)',
      'CREATE INDEX IF NOT EXISTS idx_metricas_empresa ON empresa_metricas(empresa_id, ano, mes)',
    ];

    for (const idx of indices) {
      try {
        await client.query(idx);
      } catch (e) {
        // Ignora se indice ja existe
      }
    }
    console.log('[OK] Indices criados/verificados\n');

    // =============================================
    // FUNCAO E TRIGGERS para updated_at
    // =============================================
    console.log('Criando funcao e triggers...\n');

    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $func$ language 'plpgsql'
    `);

    const triggerTables = [
      'usuarios_admin', 'empresas', 'configuracoes', 'clientes',
      'veiculos', 'agendamentos', 'pagamentos', 'transacoes',
      'pagamento_splits', 'empresa_metricas'
    ];

    for (const table of triggerTables) {
      try {
        await pool.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}`);
        await pool.query(`
          CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
      } catch (e) {
        // Ignora se tabela nao existe
      }
    }
    console.log('[OK] Funcao e triggers criados\n');

    // =============================================
    // CRIAR USUARIO ADMIN
    // =============================================
    console.log('Verificando usuario admin...\n');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vistoria.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    const existingAdmin = await pool.query(
      'SELECT id, email FROM usuarios_admin WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      const senhaHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        'INSERT INTO usuarios_admin (nome, email, senha_hash, ativo) VALUES ($1, $2, $3, true)',
        [adminName, adminEmail, senhaHash]
      );
      console.log(`[OK] Usuario admin criado: ${adminEmail}\n`);
    } else {
      console.log(`[OK] Usuario admin ja existe: ${adminEmail}\n`);
    }

    // =============================================
    // VERIFICACAO FINAL
    // =============================================
    console.log('=== Verificacao Final ===\n');

    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tabelas no banco:', tables.rows.map(r => r.table_name).join(', '));

    const adminCount = await pool.query('SELECT COUNT(*) FROM usuarios_admin');
    console.log(`Usuarios admin: ${adminCount.rows[0].count}`);

    try {
      const empresaCount = await pool.query('SELECT COUNT(*) FROM empresas');
      console.log(`Empresas: ${empresaCount.rows[0].count}`);
    } catch (e) {
      console.log('Empresas: tabela vazia');
    }

    console.log('\n[OK] Migration concluida com sucesso!');

  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error('\nErro ao executar migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('Conexao fechada.');
  }
};

runMigration();
