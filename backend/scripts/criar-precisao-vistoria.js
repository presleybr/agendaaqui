/**
 * Script para criar empresa Precisão Vistoria
 * Uso: node scripts/criar-precisao-vistoria.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function criar() {
  const client = await pool.connect();

  try {
    console.log('🚀 Criando empresa Precisão Vistoria...');

    // 1. Criar empresa
    const empresaResult = await client.query(`
      INSERT INTO empresas (nome, slug, email, telefone, whatsapp, cidade, estado, status, cor_primaria, cor_secundaria)
      VALUES ('Precisão Vistoria', 'precisao-vistoria', 'precisaovistoria@gmail.com', '', '', '', '', 'ativo', '#2563eb', '#1e40af')
      ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id
    `);
    const empresaId = empresaResult.rows[0].id;
    console.log('✅ Empresa criada/atualizada. ID:', empresaId);

    // 2. Criar usuário admin
    const senhaHash = await bcrypt.hash('123456', 10);

    await client.query(`
      INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
      VALUES ($1, 'Administrador Precisão Vistoria', 'precisaovistoria@gmail.com', $2, 'admin', true, true)
      ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, empresa_id = EXCLUDED.empresa_id
    `, [empresaId, senhaHash]);
    console.log('✅ Usuário admin criado');

    console.log('\n✅ Empresa criada com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: precisaovistoria@gmail.com');
    console.log('🔑 Senha: 123456');
    console.log('🏢 Empresa: Precisão Vistoria');
    console.log('🔗 Slug: precisao-vistoria');
    console.log('🌐 URL: https://agendaaquivistorias.com.br/precisao-vistoria');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

criar();
