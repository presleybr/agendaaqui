require('dotenv').config();
const db = require('./src/config/database');

async function debug() {
  try {
    // Listar todas as empresas
    const empresas = await db.query('SELECT id, nome, slug, status FROM empresas');
    console.log('=== EMPRESAS NO BANCO ===');
    console.log(empresas.rows);

    // Buscar empresa específica
    const teste = await db.query("SELECT * FROM empresas WHERE slug = 'terceiravisao'");
    console.log('\n=== EMPRESA terceiravisao ===');
    console.log(teste.rows[0] || 'NÃO ENCONTRADA');

    // Verificar colunas da tabela
    const colunas = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'empresas'
      ORDER BY ordinal_position
    `);
    console.log('\n=== COLUNAS DA TABELA ===');
    console.log(colunas.rows.map(c => c.column_name));

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    process.exit();
  }
}

debug();
