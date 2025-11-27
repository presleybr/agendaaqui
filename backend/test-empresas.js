/**
 * Teste de conexão e verificação da tabela empresas
 *
 * Execute com: node backend/test-empresas.js
 */

require('dotenv').config();

const db = require('./src/config/database');

async function testDatabase() {
  console.log('='.repeat(60));
  console.log('TESTE DE CONEXÃO E ESTRUTURA - TABELA EMPRESAS');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Testar conexão
    console.log('1. Testando conexão com o banco...');
    const connResult = await db.query('SELECT NOW() as now, current_database() as database');
    console.log('   ✅ Conexão estabelecida!');
    console.log(`   📅 Hora do servidor: ${connResult.rows[0].now}`);
    console.log(`   🗄️  Database: ${connResult.rows[0].database}`);
    console.log('');

    // 2. Verificar se tabela empresas existe
    console.log('2. Verificando se tabela "empresas" existe...');
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'empresas'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ Tabela "empresas" NÃO EXISTE!');
      console.log('   📌 Execute a migration: backend/migrations/add_empresa_personalization.sql');
      return;
    }
    console.log('   ✅ Tabela "empresas" existe!');
    console.log('');

    // 3. Listar colunas da tabela empresas
    console.log('3. Listando colunas da tabela "empresas"...');
    const columnsResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'empresas'
      ORDER BY ordinal_position
    `);

    console.log('');
    console.log('   Colunas encontradas:');
    console.log('   ' + '-'.repeat(56));

    const expectedColumns = [
      'id', 'nome', 'slug', 'email', 'telefone', 'endereco', 'cidade', 'estado', 'cep',
      'cor_primaria', 'cor_secundaria', 'cor_texto', 'cor_fundo',
      'logo_url', 'banner_url', 'favicon_url', 'foto_capa_url', 'foto_perfil_url',
      'template_id', 'descricao', 'horario_funcionamento',
      'preco_cautelar', 'preco_transferencia', 'preco_outros',
      'whatsapp', 'whatsapp_numero', 'facebook_url', 'instagram_url', 'site_url', 'website_url',
      'pix_key', 'chave_pix', 'pix_type',
      'status', 'plano', 'data_inicio', 'created_at', 'updated_at'
    ];

    const foundColumns = columnsResult.rows.map(r => r.column_name);

    columnsResult.rows.forEach(row => {
      console.log(`   | ${row.column_name.padEnd(25)} | ${row.data_type.padEnd(20)} |`);
    });
    console.log('   ' + '-'.repeat(56));
    console.log(`   Total: ${columnsResult.rows.length} colunas`);
    console.log('');

    // 4. Verificar colunas importantes de personalização
    console.log('4. Verificando colunas de personalização...');
    const personalizationColumns = [
      'cor_primaria', 'cor_secundaria', 'logo_url', 'foto_capa_url',
      'preco_cautelar', 'preco_transferencia', 'preco_outros',
      'whatsapp', 'facebook_url', 'instagram_url', 'descricao', 'horario_funcionamento'
    ];

    const missingColumns = personalizationColumns.filter(col => !foundColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('   ⚠️  Colunas de personalização faltando:');
      missingColumns.forEach(col => console.log(`      - ${col}`));
    } else {
      console.log('   ✅ Todas as colunas de personalização existem!');
    }
    console.log('');

    // 5. Contar empresas
    console.log('5. Contando empresas no banco...');
    const countResult = await db.query('SELECT COUNT(*) as total FROM empresas');
    console.log(`   📊 Total de empresas: ${countResult.rows[0].total}`);
    console.log('');

    // 6. Listar empresas existentes (se houver)
    if (parseInt(countResult.rows[0].total) > 0) {
      console.log('6. Listando empresas existentes...');
      const empresasResult = await db.query(`
        SELECT id, nome, slug, status, cor_primaria, cor_secundaria,
               preco_cautelar, preco_transferencia, whatsapp
        FROM empresas
        ORDER BY created_at DESC
        LIMIT 5
      `);

      console.log('');
      empresasResult.rows.forEach((emp, i) => {
        console.log(`   [${i + 1}] ${emp.nome} (${emp.slug})`);
        console.log(`       Status: ${emp.status || 'N/A'}`);
        console.log(`       Cores: ${emp.cor_primaria || 'N/A'} / ${emp.cor_secundaria || 'N/A'}`);
        console.log(`       Preços: Cautelar=${emp.preco_cautelar || 0}, Transfer=${emp.preco_transferencia || 0}`);
        console.log(`       WhatsApp: ${emp.whatsapp || 'N/A'}`);
        console.log('');
      });
    }

    // 7. Verificar tabela empresa_carrossel
    console.log('7. Verificando tabela "empresa_carrossel"...');
    const carrosselCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'empresa_carrossel'
      ) as exists
    `);

    if (carrosselCheck.rows[0].exists) {
      console.log('   ✅ Tabela "empresa_carrossel" existe!');
    } else {
      console.log('   ⚠️  Tabela "empresa_carrossel" NÃO existe');
    }
    console.log('');

    // 8. Verificar tabela templates
    console.log('8. Verificando tabela "templates"...');
    const templatesCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'templates'
      ) as exists
    `);

    if (templatesCheck.rows[0].exists) {
      console.log('   ✅ Tabela "templates" existe!');
    } else {
      console.log('   ⚠️  Tabela "templates" NÃO existe (opcional)');
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('');
    console.error('Detalhes:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase();
