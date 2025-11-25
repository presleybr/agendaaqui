require('dotenv').config();
const { Pool } = require('pg');

// Validar DATABASE_URL (apenas warning, não mata o processo)
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  AVISO: DATABASE_URL não configurada!');
  console.warn('📝 Configure a variável de ambiente DATABASE_URL com a connection string do PostgreSQL');
  console.warn('   Exemplo: postgresql://usuario:senha@localhost:5432/agendaaqui');
  console.warn('🔄 Servidor irá iniciar mas funcionalidades de banco estarão indisponíveis');
}

// Criar pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10 segundos (era 2s)
  statement_timeout: 30000, // timeout de statements SQL
  query_timeout: 30000,
  application_name: 'agendaaqui-backend'
});

// Evento de erro
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool do PostgreSQL:', err.message);
});

// Teste de conexão assíncrono (não bloqueia a inicialização)
let isConnected = false;

const testConnection = async () => {
  try {
    console.log('🔄 Testando conexão com PostgreSQL...');
    const result = await pool.query('SELECT NOW() as now, version() as version');
    isConnected = true;
    console.log('✅ PostgreSQL conectado com sucesso!');
    console.log('📅 Data/Hora do servidor:', result.rows[0].now);
    console.log('📊 Versão:', result.rows[0].version.split('\n')[0]);
  } catch (err) {
    isConnected = false;
    console.error('❌ Erro ao conectar com PostgreSQL:', err.message);
    console.error('🔄 Tentando reconectar em 5 segundos...');

    // Retry após 5 segundos
    setTimeout(testConnection, 5000);
  }
};

// Iniciar teste de conexão
if (process.env.DATABASE_URL) {
  testConnection();
} else {
  console.warn('⚠️  DATABASE_URL não configurada - pulando teste de conexão');
}

// Wrapper para manter compatibilidade com código existente
const db = {
  pool,

  // Verificar se está conectado
  isConnected: () => isConnected,

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
