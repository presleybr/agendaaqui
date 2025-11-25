const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addHorariosBloqueadosTable() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando migração: adicionar tabela horarios_bloqueados...');

    // Verificar se a tabela já existe
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'horarios_bloqueados'
      );
    `);

    if (checkTable.rows[0].exists) {
      console.log('✅ Tabela horarios_bloqueados já existe!');
      return;
    }

    // Criar a tabela
    await client.query(`
      CREATE TABLE horarios_bloqueados (
        id SERIAL PRIMARY KEY,
        data DATE NOT NULL,
        horario_inicio TIME,
        horario_fim TIME,
        motivo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabela horarios_bloqueados criada com sucesso!');

    // Criar índice
    await client.query(`
      CREATE INDEX idx_horarios_bloqueados_data ON horarios_bloqueados(data);
    `);

    console.log('✅ Índice criado com sucesso!');
    console.log('✅ Migração concluída!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
addHorariosBloqueadosTable()
  .then(() => {
    console.log('🎉 Migração executada com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
