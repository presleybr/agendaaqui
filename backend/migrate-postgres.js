require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const runMigration = async () => {
  // ============================================
  // PROTEÇÃO: BLOQUEAR EM PRODUÇÃO
  // ============================================
  if (process.env.NODE_ENV === 'production') {
    console.error('');
    console.error('🚫 ════════════════════════════════════════════════════════════');
    console.error('🚫  BLOQUEADO: Este script NÃO pode ser executado em produção!');
    console.error('🚫 ════════════════════════════════════════════════════════════');
    console.error('');
    console.error('⚠️  Este script executa DROP TABLE e APAGA TODOS OS DADOS!');
    console.error('');
    console.error('📝 Para aplicar migrations em produção, use:');
    console.error('   npm run migrate:incremental');
    console.error('');
    console.error('💡 Se você REALMENTE precisa recriar o banco em produção:');
    console.error('   1. Faça backup dos dados primeiro');
    console.error('   2. Execute: FORCE_DANGEROUS_MIGRATION=true npm run migrate:postgres');
    console.error('');

    if (process.env.FORCE_DANGEROUS_MIGRATION !== 'true') {
      process.exit(1);
    }

    console.warn('⚠️  FORCE_DANGEROUS_MIGRATION=true detectado. Continuando...');
    console.warn('⚠️  Você tem 10 segundos para cancelar (Ctrl+C)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

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
    console.warn('⚠️  ATENÇÃO: Este script vai APAGAR e RECRIAR todas as tabelas!\n');

    // Ler o arquivo SQL principal
    const sqlPath = path.join(__dirname, 'database', 'schema-postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Lendo arquivo de migração:', sqlPath);
    console.log('📝 Executando SQL...\n');

    // Executar o SQL
    await pool.query(sql);

    console.log('✅ Migração principal concluída!');

    // Executar migrations adicionais (se existirem)
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        console.log(`\n📄 Executando migration: ${file}`);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSql);
        console.log(`✅ Migration ${file} concluída!`);
      }
    }

    console.log('\n📊 Tabelas criadas/atualizadas:');
    console.log('   - usuarios_admin');
    console.log('   - empresas (com campos de personalização)');
    console.log('   - empresa_carrossel');
    console.log('   - templates');
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
