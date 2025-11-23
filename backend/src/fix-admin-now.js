require('dotenv').config();

const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  try {
    console.log('🔧 Corrigindo admin no banco de dados...\n');

    const usePostgres = !!process.env.DATABASE_URL;
    console.log(`📊 Usando: ${usePostgres ? 'PostgreSQL' : 'SQLite'}\n`);

    // Credenciais do environment ou usar as do Render
    const adminEmail = process.env.ADMIN_EMAIL || 'automacoesvon@gmail.com';
    const adminSenha = process.env.ADMIN_PASSWORD || 'SenhaForte123!@';
    const adminNome = process.env.ADMIN_NAME || 'Victor';

    console.log('👤 Credenciais que serão criadas:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminSenha}`);
    console.log(`   Nome: ${adminNome}\n`);

    if (usePostgres) {
      // 1. Deletar admin antigo
      console.log('🗑️  Deletando admin antigo (admin@suavistoria.com)...');
      const deleteResult = await db.query(
        'DELETE FROM usuarios_admin WHERE email = $1 RETURNING *',
        ['admin@suavistoria.com']
      );

      if (deleteResult.rows.length > 0) {
        console.log('✅ Admin antigo deletado!');
        console.log('   Deletado:', deleteResult.rows[0].email);
      } else {
        console.log('ℹ️  Admin antigo não encontrado (já foi deletado)');
      }
      console.log('');

      // 2. Verificar se o admin correto já existe
      console.log('🔍 Verificando se admin correto já existe...');
      const checkResult = await db.query(
        'SELECT * FROM usuarios_admin WHERE email = $1',
        [adminEmail]
      );

      if (checkResult.rows.length > 0) {
        console.log('⚠️  Admin correto já existe! Atualizando senha...');
        const senha_hash = await bcrypt.hash(adminSenha, 10);

        await db.query(
          'UPDATE usuarios_admin SET senha_hash = $1, nome = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3',
          [senha_hash, adminNome, adminEmail]
        );

        console.log('✅ Senha atualizada!');
      } else {
        // 3. Criar novo admin
        console.log('➕ Criando novo admin...');
        const senha_hash = await bcrypt.hash(adminSenha, 10);

        const result = await db.query(
          `INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
          VALUES ($1, $2, $3, 'super_admin', 'ativo')
          RETURNING *`,
          [adminNome, adminEmail, senha_hash]
        );

        console.log('✅ Admin criado com sucesso!');
        console.log('');
        console.log('Dados criados:');
        console.log(result.rows[0]);
      }

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 CREDENCIAIS PARA LOGIN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminSenha}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('✅ PRONTO! Agora você pode fazer login com estas credenciais.');
      console.log('');

    } else {
      // SQLite (desenvolvimento local)
      console.log('🗑️  Deletando admin antigo...');
      const deleteInfo = db.prepare('DELETE FROM usuarios_admin WHERE email = ?')
        .run('admin@suavistoria.com');

      if (deleteInfo.changes > 0) {
        console.log('✅ Admin antigo deletado!');
      } else {
        console.log('ℹ️  Admin antigo não encontrado');
      }
      console.log('');

      // Verificar se já existe
      const existing = db.prepare('SELECT * FROM usuarios_admin WHERE email = ?')
        .get(adminEmail);

      if (existing) {
        console.log('⚠️  Admin correto já existe! Atualizando senha...');
        const senha_hash = await bcrypt.hash(adminSenha, 10);

        db.prepare('UPDATE usuarios_admin SET senha_hash = ?, nome = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?')
          .run(senha_hash, adminNome, adminEmail);

        console.log('✅ Senha atualizada!');
      } else {
        console.log('➕ Criando novo admin...');
        const senha_hash = await bcrypt.hash(adminSenha, 10);

        const result = db.prepare(
          `INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
          VALUES (?, ?, ?, 'super_admin', 'ativo')`
        ).run(adminNome, adminEmail, senha_hash);

        console.log('✅ Admin criado com sucesso!');
        console.log(`ID: ${result.lastInsertRowid}`);
      }

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 CREDENCIAIS PARA LOGIN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminSenha}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error);
    console.error('\nDetalhes:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

fixAdmin();
