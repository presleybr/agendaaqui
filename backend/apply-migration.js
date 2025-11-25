/**
 * Script para aplicar a migration 006 no banco PostgreSQL do Render
 *
 * Uso:
 *   node apply-migration.js
 *
 * Certifique-se de ter DATABASE_URL configurada no .env
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migration...\n');

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada!');
    console.error('   Configure a variável de ambiente DATABASE_URL no arquivo .env');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL configurada');
  console.log(`📍 Conectando ao banco: ${process.env.DATABASE_URL.split('@')[1]}\n`);

  try {
    // Testar conexão
    await db.query('SELECT NOW()');
    console.log('✅ Conexão com banco estabelecida\n');

    // Ler migration
    const migrationPath = path.join(__dirname, 'src', 'migrations', '006_fix_and_customization.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration carregada:');
    console.log(`   ${migrationPath}\n`);

    // Executar migration
    console.log('⏳ Executando migration...\n');
    await db.query(migrationSQL);

    console.log('✅ Migration aplicada com sucesso!\n');

    // Verificar estrutura da tabela empresas
    console.log('🔍 Verificando estrutura da tabela empresas...\n');
    const result = await db.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'empresas'
      ORDER BY ordinal_position
    `);

    console.log('📋 Colunas da tabela empresas:');
    console.log('================================');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log('\n');

    // Verificar tabelas criadas
    console.log('🔍 Verificando tabelas criadas...\n');
    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 Tabelas no banco:');
    console.log('================================');
    tables.rows.forEach(t => {
      console.log(`   ✓ ${t.table_name}`);
    });

    // Verificar se pagamento_splits existe
    const hasSplits = tables.rows.some(t => t.table_name === 'pagamento_splits');
    const hasMetricas = tables.rows.some(t => t.table_name === 'empresa_metricas');

    console.log('\n📊 Verificação de tabelas críticas:');
    console.log(`   pagamento_splits: ${hasSplits ? '✅ Existe' : '❌ Não encontrada'}`);
    console.log(`   empresa_metricas: ${hasMetricas ? '✅ Existe' : '❌ Não encontrada'}`);

    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Teste os endpoints: GET /api/tenant/config?slug=demo');
    console.log('   2. Teste criar uma empresa no admin');
    console.log('   3. Configure os campos visuais de uma empresa');
    console.log('   4. Acesse a página da empresa: /nomeempresa\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    console.error('\n📝 Detalhes:', error.message);

    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }

    if (error.position) {
      console.error(`   Posição no SQL: ${error.position}`);
    }

    console.error('\n💡 Dicas:');
    console.error('   - Verifique se o DATABASE_URL está correto');
    console.error('   - Confirme que tem permissões no banco');
    console.error('   - Verifique se as tabelas base existem (empresas, pagamentos, etc)');

    process.exit(1);
  }
}

// Executar
applyMigration();
