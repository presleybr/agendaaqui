#!/usr/bin/env node

/**
 * Script para ativar o Super Admin no banco PostgreSQL
 * Execute: node fix-admin-ativo.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const runFix = async () => {
  console.log('\n🔧 Iniciando fix: Ativar Super Admin...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada!');
    console.error('📝 Configure a variável de ambiente DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Conectar ao banco
    console.log('🔄 Conectando ao PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL!\n');

    // Verificar estado atual
    console.log('🔍 Verificando super admin atual...');
    const beforeResult = await pool.query(
      'SELECT id, nome, email, ativo, created_at FROM usuarios_admin WHERE email = $1',
      ['admin@vistoria.com']
    );

    if (beforeResult.rows.length === 0) {
      console.log('⚠️  Super admin não encontrado no banco!');
      console.log('💡 Execute a migração primeiro: npm run migrate:postgres');
      process.exit(1);
    }

    const before = beforeResult.rows[0];
    console.log('📊 Estado atual:', {
      id: before.id,
      nome: before.nome,
      email: before.email,
      ativo: before.ativo,
      created_at: before.created_at
    });

    if (before.ativo === true) {
      console.log('\n✅ Super admin já está ativo! Nada a fazer.');
      await pool.end();
      return;
    }

    // Executar fix
    console.log('\n🔧 Ativando super admin...');
    await pool.query(
      'UPDATE usuarios_admin SET ativo = true WHERE email = $1',
      ['admin@vistoria.com']
    );

    // Verificar resultado
    const afterResult = await pool.query(
      'SELECT id, nome, email, ativo, created_at FROM usuarios_admin WHERE email = $1',
      ['admin@vistoria.com']
    );

    const after = afterResult.rows[0];
    console.log('\n✅ Super admin ativado com sucesso!');
    console.log('📊 Novo estado:', {
      id: after.id,
      nome: after.nome,
      email: after.email,
      ativo: after.ativo,
      created_at: after.created_at
    });

    console.log('\n🎉 Fix concluído!');
    console.log('🔑 Você pode fazer login agora:');
    console.log('   Email: admin@vistoria.com');
    console.log('   Senha: Admin123!@#\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro ao executar fix:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
    process.exit(1);
  }
};

runFix();
