/**
 * Script para criar usuário admin para uma empresa existente
 * Uso: node create-empresa-user.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function createEmpresaUser() {
  // Configuração - empresa matriz
  const empresaEmail = 'contato@agendaaquivistorias.com.br';
  const userName = 'Administrador';
  const userEmail = empresaEmail; // Mesmo email da empresa

  try {
    console.log('Conectando ao banco de dados...');

    // 1. Buscar empresa pelo email
    const empresaResult = await db.query(
      'SELECT id, nome, slug FROM empresas WHERE email = $1',
      [empresaEmail]
    );

    if (empresaResult.rows.length === 0) {
      console.error('Empresa não encontrada com email:', empresaEmail);
      process.exit(1);
    }

    const empresa = empresaResult.rows[0];
    console.log(`Empresa encontrada: ${empresa.nome} (ID: ${empresa.id})`);

    // 2. Verificar se já existe usuário
    const userCheck = await db.query(
      'SELECT id FROM usuarios_empresa WHERE email = $1',
      [userEmail]
    );

    if (userCheck.rows.length > 0) {
      console.log('Usuário já existe para este email. Resetando para primeiro acesso...');

      // Resetar para primeiro acesso (sem senha definida)
      await db.query(
        `UPDATE usuarios_empresa
         SET primeiro_acesso = true,
             senha_hash = $1,
             ativo = true,
             updated_at = NOW()
         WHERE email = $2`,
        ['$2b$10$placeholder.needs.reset.on.first.access', userEmail]
      );

      console.log('Usuário resetado! Faça login com o email para criar nova senha.');
      process.exit(0);
    }

    // 3. Criar usuário com senha temporária (será alterada no primeiro acesso)
    const tempPassword = '$2b$10$placeholder.needs.reset.on.first.access';

    const result = await db.query(`
      INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
      VALUES ($1, $2, $3, $4, 'admin', true, true)
      RETURNING id
    `, [empresa.id, userName, userEmail, tempPassword]);

    console.log('');
    console.log('='.repeat(50));
    console.log('USUÁRIO CRIADO COM SUCESSO!');
    console.log('='.repeat(50));
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Email: ${userEmail}`);
    console.log(`Empresa: ${empresa.nome}`);
    console.log('');
    console.log('O usuário deverá criar sua senha no primeiro acesso.');
    console.log(`Acesse: https://agendaaquivistorias.com.br/cliente`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Erro:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

createEmpresaUser();
