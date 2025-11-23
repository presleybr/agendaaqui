const bcrypt = require('bcryptjs');
require('dotenv').config();

// Detecta se está usando PostgreSQL ou SQLite
const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  db = pool;
} else {
  console.log('❌ DATABASE_URL não encontrado. Use o script run.js para SQLite');
  process.exit(1);
}

console.log('🔄 Executando migrations para PostgreSQL...\n');

const createTables = async () => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Tabela de usuários admin
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
    console.log('✅ Tabela usuarios_admin criada');

    // Tabela de clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela clientes criada');

    // Tabela de veículos
    await client.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(8) NOT NULL,
        marca VARCHAR(100) NOT NULL,
        modelo VARCHAR(100) NOT NULL,
        ano INTEGER NOT NULL,
        chassi VARCHAR(50),
        cliente_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela veiculos criada');

    // Tabela de agendamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id SERIAL PRIMARY KEY,
        protocolo VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INTEGER NOT NULL,
        veiculo_id INTEGER NOT NULL,
        tipo_vistoria VARCHAR(50) NOT NULL,
        data DATE NOT NULL,
        horario TIME NOT NULL,
        endereco_vistoria TEXT,
        preco INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        observacoes TEXT,
        confirmado_email BOOLEAN DEFAULT false,
        lembrete_enviado BOOLEAN DEFAULT false,
        pagamento_confirmado BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE,
        CHECK (status IN ('pendente', 'confirmado', 'realizado', 'cancelado'))
      )
    `);
    console.log('✅ Tabela agendamentos criada');

    // Tabela de configurações
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT NOT NULL,
        descricao TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela configuracoes criada');

    // Tabela de horários bloqueados
    await client.query(`
      CREATE TABLE IF NOT EXISTS horarios_bloqueados (
        id SERIAL PRIMARY KEY,
        data DATE NOT NULL,
        horario_inicio TIME,
        horario_fim TIME,
        motivo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela horarios_bloqueados criada');

    // Tabela de logs de email
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        agendamento_id INTEGER,
        tipo VARCHAR(50) NOT NULL,
        destinatario VARCHAR(255) NOT NULL,
        assunto VARCHAR(255) NOT NULL,
        enviado BOOLEAN DEFAULT false,
        erro TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela email_logs criada');

    // Tabela de pagamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id SERIAL PRIMARY KEY,
        agendamento_id INTEGER NOT NULL,
        mp_payment_id VARCHAR(255),
        tipo_pagamento VARCHAR(20) NOT NULL CHECK(tipo_pagamento IN ('pix', 'credito', 'debito')),
        valor INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
        qr_code TEXT,
        qr_code_base64 TEXT,
        payment_method_id VARCHAR(50),
        installments INTEGER DEFAULT 1,
        dados_pagamento TEXT,
        data_pagamento TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela pagamentos criada');

    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_protocolo ON agendamentos(protocolo);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento ON pagamentos(agendamento_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_payment ON pagamentos(mp_payment_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
    `);
    console.log('✅ Índices criados');

    // Criar usuário admin padrão
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vistoria.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    const existingAdmin = await client.query('SELECT id FROM usuarios_admin WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      const senhaHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'INSERT INTO usuarios_admin (nome, email, senha_hash) VALUES ($1, $2, $3)',
        [adminName, adminEmail, senhaHash]
      );
      console.log('\n✅ Usuário admin criado:');
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Senha: ${adminPassword}`);
      console.log('   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
    } else {
      console.log('\nℹ️  Usuário admin já existe\n');
    }

    // Inserir configurações padrão
    const configs = [
      ['horario_inicio', '08:00', 'Horário de início do atendimento'],
      ['horario_fim', '18:00', 'Horário de fim do atendimento'],
      ['duracao_slot', '60', 'Duração de cada slot em minutos'],
      ['dias_trabalho', '1,2,3,4,5,6', 'Dias da semana que funcionam (0=Domingo, 6=Sábado)'],
      ['preco_cautelar', process.env.PRICE_CAUTELAR || '15000', 'Preço da vistoria cautelar em centavos'],
      ['preco_transferencia', process.env.PRICE_TRANSFERENCIA || '12000', 'Preço da vistoria de transferência em centavos'],
      ['preco_outros', process.env.PRICE_OUTROS || '10000', 'Preço de outros serviços em centavos'],
      ['min_antecedencia_horas', process.env.MIN_ADVANCE_HOURS || '2', 'Antecedência mínima para agendamento em horas'],
      ['max_antecedencia_dias', process.env.MAX_ADVANCE_DAYS || '30', 'Antecedência máxima para agendamento em dias'],
      ['vagas_por_horario', '3', 'Número de vagas por horário']
    ];

    for (const [chave, valor, descricao] of configs) {
      await client.query(`
        INSERT INTO configuracoes (chave, valor, descricao)
        VALUES ($1, $2, $3)
        ON CONFLICT (chave) DO UPDATE SET valor = $2, descricao = $3
      `, [chave, valor, descricao]);
    }
    console.log('✅ Configurações padrão inseridas\n');

    await client.query('COMMIT');
    console.log('✅ Migrations básicas executadas com sucesso!\n');

    // Executar migration de multi-tenancy
    console.log('🔄 Executando migration de multi-tenancy...\n');
    const fs = require('fs');
    const path = require('path');
    const multitenantSQL = fs.readFileSync(
      path.join(__dirname, '005_multitenant_saas.sql'),
      'utf8'
    );

    await client.query(multitenantSQL);
    console.log('✅ Migration de multi-tenancy executada com sucesso!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro ao executar migrations:', error);
    throw error;
  } finally {
    client.release();
  }
};

createTables()
  .then(async () => {
    await db.end();
    process.exit(0);
  })
  .catch(async () => {
    await db.end();
    process.exit(1);
  });
