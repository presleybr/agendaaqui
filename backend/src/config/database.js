require('dotenv').config();
const { Pool } = require('pg');

// Validar DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não configurada!');
  console.error('📝 Configure a variável de ambiente DATABASE_URL com a connection string do PostgreSQL');
  console.error('   Exemplo: postgresql://usuario:senha@localhost:5432/agendaaqui');
  process.exit(1);
}

// Criar pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento de erro
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool do PostgreSQL', err);
});

// Teste de conexão na inicialização
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar com PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('✅ PostgreSQL conectado com sucesso!');
  console.log('📅 Data/Hora do servidor:', res.rows[0].now);
});

// Wrapper para manter compatibilidade com código existente
const db = {
  pool,

  // Query genérica
  query: (sql, params) => {
    console.log('🔍 SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    if (params && params.length > 0) {
      console.log('📝 Params:', params);
    }
    return pool.query(sql, params);
  },

  // Buscar um único registro
  get: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },

  // Buscar todos os registros
  all: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  // Executar comando (INSERT, UPDATE, DELETE)
  run: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result;
  }
};

module.exports = db;
