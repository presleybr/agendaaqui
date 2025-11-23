require('dotenv').config();

const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔍 Verificando conexão com banco de dados...\n');

    const usePostgres = !!process.env.DATABASE_URL;
    console.log(`📊 Usando: ${usePostgres ? 'PostgreSQL' : 'SQLite'}\n`);

    // Dados do admin
    const adminEmail = process.env.ADMIN_EMAIL || 'automacoesvon@gmail.com';
    const adminSenha = process.env.ADMIN_PASSWORD || '1657victOr@';
    const adminNome = process.env.ADMIN_NAME || 'Victor';

    console.log('👤 Dados do admin:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminSenha}`);
    console.log(`   Nome: ${adminNome}\n`);

    // Verificar se já existe
    console.log('🔍 Verificando se admin já existe...');

    if (usePostgres) {
      const checkResult = await db.query(
        'SELECT * FROM usuarios_admin WHERE email = $1',
        [adminEmail]
      );

      if (checkResult.rows.length > 0) {
        console.log('⚠️  Admin já existe no banco de dados!\n');
        console.log('Admin encontrado:');
        console.log(checkResult.rows[0]);

        // Atualizar senha
        console.log('\n🔄 Atualizando senha...');
        const senha_hash = await bcrypt.hash(adminSenha, 10);

        await db.query(
          'UPDATE usuarios_admin SET senha_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
          [senha_hash, adminEmail]
        );

        console.log('✅ Senha atualizada com sucesso!');
        process.exit(0);
      }

      // Criar novo admin
      console.log('➕ Criando novo admin...');
      const senha_hash = await bcrypt.hash(adminSenha, 10);

      const result = await db.query(
        `INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
        VALUES ($1, $2, $3, 'super_admin', 'ativo')
        RETURNING *`,
        [adminNome, adminEmail, senha_hash]
      );

      console.log('\n✅ Admin criado com sucesso!\n');
      console.log('Dados criados:');
      console.log(result.rows[0]);
      console.log('\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 CREDENCIAIS PARA LOGIN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminSenha}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n');

    } else {
      // SQLite
      const existing = db.prepare('SELECT * FROM usuarios_admin WHERE email = ?').get(adminEmail);

      if (existing) {
        console.log('⚠️  Admin já existe!\n');
        console.log(existing);

        // Atualizar senha
        console.log('\n🔄 Atualizando senha...');
        const senha_hash = await bcrypt.hash(adminSenha, 10);

        db.prepare('UPDATE usuarios_admin SET senha_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?')
          .run(senha_hash, adminEmail);

        console.log('✅ Senha atualizada!');
        process.exit(0);
      }

      // Criar novo
      console.log('➕ Criando novo admin...');
      const senha_hash = await bcrypt.hash(adminSenha, 10);

      const result = db.prepare(
        `INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
        VALUES (?, ?, ?, 'super_admin', 'ativo')`
      ).run(adminNome, adminEmail, senha_hash);

      console.log('\n✅ Admin criado com sucesso!');
      console.log(`ID: ${result.lastInsertRowid}`);
      console.log('\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 CREDENCIAIS PARA LOGIN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminSenha}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error);
    console.error('\nDetalhes:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

createAdmin();
