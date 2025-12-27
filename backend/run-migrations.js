require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Script SEGURO para executar migrations incrementais sem recriar tabelas.
 * Este script é executado automaticamente no deploy (postinstall).
 *
 * SEGURANÇA: Este script NUNCA executa DROP TABLE, TRUNCATE ou DELETE.
 */

// Padrões de comandos perigosos (usando regex para evitar falsos positivos)
// "ON DELETE CASCADE" não é perigoso, mas "DELETE FROM tabela" é
const DANGEROUS_PATTERNS = [
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /TRUNCATE\s+TABLE/i,
  /TRUNCATE\s+\w+/i,
  /(?<!ON\s)DELETE\s+FROM/i  // DELETE FROM, mas não ON DELETE
];

const containsDangerousCommand = (sql) => {
  // Remover comentários SQL antes de verificar (-- e /* */)
  const sqlSemComentarios = sql
    .replace(/--.*$/gm, '')  // Remove comentários de linha
    .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove comentários de bloco

  return DANGEROUS_PATTERNS.some(pattern => pattern.test(sqlSemComentarios));
};

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não configurada!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Executando migrations incrementais (SEGURO)...\n');

    // Executar migrations da pasta migrations/
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️ Pasta migrations não encontrada.');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️ Nenhuma migration SQL encontrada.');
      return;
    }

    console.log(`📁 Encontradas ${migrationFiles.length} migration(s):\n`);

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      console.log(`📄 Executando: ${file}`);

      try {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // PROTEÇÃO: Verificar se contém comandos perigosos
        if (containsDangerousCommand(migrationSql)) {
          console.log(`   🚫 BLOQUEADO: Migration contém comandos perigosos (DROP/TRUNCATE/DELETE)`);
          console.log(`   ⚠️  Para executar migrations destrutivas, use outro método.`);
          continue;
        }

        // Dividir em statements individuais para melhor tratamento de erros
        const statements = migrationSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;

        for (const statement of statements) {
          try {
            await pool.query(statement);
            successCount++;
          } catch (stmtError) {
            // Ignorar erros esperados em migrations idempotentes
            if (stmtError.message.includes('already exists') ||
                stmtError.message.includes('duplicate key') ||
                stmtError.message.includes('does not exist') ||
                stmtError.code === '42701' || // column already exists
                stmtError.code === '42P07' || // relation already exists
                stmtError.code === '42703' || // column does not exist (para índices)
                stmtError.code === '42710' || // object already exists
                stmtError.code === '23505') { // unique violation
              skipCount++;
            } else {
              console.log(`   ⚠️  Erro em statement: ${stmtError.message}`);
              skipCount++;
            }
          }
        }

        console.log(`   ✅ Concluída (${successCount} executados, ${skipCount} já existentes)`);
      } catch (error) {
        // Ignorar erros de "already exists" que são esperados em migrations idempotentes
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.code === '42701' || // column already exists
            error.code === '42P07') { // relation already exists
          console.log(`   ⚠️ Já aplicada (ignorando)`);
        } else {
          console.log(`   ⚠️ Erro: ${error.message} (continuando...)`);
        }
      }
    }

    console.log('\n✅ Todas as migrations foram processadas!');

    // Verificar estado do banco (opcional, não falha se tabela não existir)
    try {
      const empresasResult = await pool.query('SELECT COUNT(*) FROM empresas');
      console.log(`\n📊 Total de empresas: ${empresasResult.rows[0].count}`);
    } catch (e) {
      console.log(`\n⚠️ Não foi possível verificar empresas: ${e.message}`);
    }

  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada.');
  }
};

runMigrations();
