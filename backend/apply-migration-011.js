/**
 * Script para aplicar a migration 011 no banco PostgreSQL
 * Remove NOT NULL constraint de chave_pix_destino
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function applyMigration() {
  console.log('🚀 Aplicando migration 011...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }

  try {
    await db.query('SELECT NOW()');
    console.log('✅ Conexão com banco OK\n');

    // Ler migration
    const migrationPath = path.join(__dirname, 'migrations', '011_fix_pagamento_splits_nullable.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('⏳ Executando...\n');
    await db.query(migrationSQL);

    console.log('✅ Migration 011 aplicada com sucesso!');
    console.log('   chave_pix_destino agora permite NULL\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();
