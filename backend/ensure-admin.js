#!/usr/bin/env node
/**
 * Script para garantir que o usuário admin existe
 * Execute no Render Shell: node ensure-admin.js
 */

const bcrypt = require('bcryptjs');
require('dotenv').config();

const usePostgres = !!process.env.DATABASE_URL;

if (!usePostgres) {
  console.log('❌ DATABASE_URL não encontrado');
  process.exit(1);
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function ensureAdmin() {
  const client = await pool.connect();

  try {
    console.log('🔍 Verificando se tabela usuarios_admin existe...');

    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'usuarios_admin'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela usuarios_admin não existe!');
      console.log('💡 Execute primeiro: npm run migrate:postgres');
      process.exit(1);
    }

    console.log('✅ Tabela usuarios_admin existe');

    // Credenciais do admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vistoria.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    // Verificar se o admin já existe
    const existingAdmin = await client.query(
      'SELECT id, nome, email FROM usuarios_admin WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('\n✅ Usuário admin já existe:');
      console.log(`   ID: ${existingAdmin.rows[0].id}`);
      console.log(`   Nome: ${existingAdmin.rows[0].nome}`);
      console.log(`   Email: ${existingAdmin.rows[0].email}`);
      console.log('\n💡 Para redefinir a senha, delete o usuário e execute este script novamente');
      process.exit(0);
    }

    // Criar o admin
    console.log('\n🔨 Criando usuário admin...');
    const senhaHash = await bcrypt.hash(adminPassword, 10);

    await client.query(
      'INSERT INTO usuarios_admin (nome, email, senha_hash, ativo) VALUES ($1, $2, $3, $4)',
      [adminName, adminEmail, senhaHash, true]
    );

    console.log('\n✅ Usuário admin criado com sucesso!');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Senha: ${adminPassword}`);
    console.log('   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ensureAdmin();
