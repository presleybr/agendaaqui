require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não configurada!');
    console.error('📝 Configure a variável de ambiente DATABASE_URL no arquivo .env');
    console.error('   Exemplo: DATABASE_URL=postgresql://usuario:senha@localhost:5432/agendaaqui');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Iniciando migração para PostgreSQL...\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'database', 'schema-postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Lendo arquivo de migração:', sqlPath);
    console.log('📝 Executando SQL...\n');

    // Executar o SQL
    await pool.query(sql);

    console.log('✅ Migração concluída com sucesso!');
    console.log('\n📊 Tabelas criadas:');
    console.log('   - usuarios_admin');
    console.log('   - empresas');
    console.log('   - configuracoes');
    console.log('   - clientes');
    console.log('   - veiculos');
    console.log('   - agendamentos');
    console.log('   - pagamentos');
    console.log('   - transacoes');
    console.log('   - notificacoes');
    console.log('   - horarios_bloqueados');

    console.log('\n👤 Usuário Admin criado:');
    console.log('   Email: admin@vistoria.com');
    console.log('   Senha: Admin123!@#');

    console.log('\n🏢 Empresa Demo criada:');
    console.log('   Nome: Vistoria Express Demo');
    console.log('   Slug: demo');
    console.log('   URL: demo.agendaaquivistorias.com.br');

    // Verificar dados criados
    const result = await pool.query('SELECT COUNT(*) FROM usuarios_admin');
    console.log(`\n✅ Total de usuários admin: ${result.rows[0].count}`);

    const empresasResult = await pool.query('SELECT COUNT(*) FROM empresas');
    console.log(`✅ Total de empresas: ${empresasResult.rows[0].count}`);

  } catch (error) {
    console.error('\n❌ Erro ao executar migração:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada.');
  }
};

runMigration();
