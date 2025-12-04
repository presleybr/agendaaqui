/**
 * Script para popular usuários admin para todas as empresas
 * Uso: node populate-usuarios.js
 */

require('dotenv').config();
const db = require('./src/config/database');

async function populateUsuarios() {
  console.log('🚀 Criando usuários admin para todas as empresas...\n');

  try {
    // Buscar todas as empresas ativas
    const empresasResult = await db.query(
      'SELECT id, nome, slug, email FROM empresas WHERE status = $1',
      ['ativo']
    );
    const empresas = empresasResult.rows;

    if (empresas.length === 0) {
      console.error('❌ Nenhuma empresa encontrada. Execute populate-empresas.js primeiro.');
      process.exit(1);
    }

    console.log(`📊 ${empresas.length} empresas encontradas\n`);

    let criados = 0;
    let existentes = 0;

    for (const empresa of empresas) {
      const userEmail = empresa.email;
      const userName = 'Administrador';

      // Verificar se já existe usuário para esta empresa
      const userCheck = await db.query(
        'SELECT id FROM usuarios_empresa WHERE empresa_id = $1',
        [empresa.id]
      );

      if (userCheck.rows.length > 0) {
        console.log(`⏭️  ${empresa.nome}: usuário já existe`);
        existentes++;
        continue;
      }

      // Criar usuário com senha temporária (será alterada no primeiro acesso)
      const tempPassword = '$2b$10$placeholder.needs.reset.on.first.access';

      await db.query(`
        INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
        VALUES ($1, $2, $3, $4, 'admin', true, true)
      `, [empresa.id, userName, userEmail, tempPassword]);

      console.log(`✅ ${empresa.nome}: usuário criado (${userEmail})`);
      criados++;
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`Usuários criados:    ${criados}`);
    console.log(`Já existentes:       ${existentes}`);
    console.log(`Total empresas:      ${empresas.length}`);
    console.log('='.repeat(60));
    console.log('\n✅ Script concluído!');
    console.log('\n📝 Para fazer login:');
    console.log('   1. Acesse https://agendaaquivistorias.com.br/cliente.html');
    console.log('   2. Digite o email da empresa (ex: contato@agendaaquimatriz.com.br)');
    console.log('   3. Como é primeiro acesso, crie uma senha');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

populateUsuarios();
