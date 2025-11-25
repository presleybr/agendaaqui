/**
 * Script completo para configurar o sistema no Render
 *
 * Este script:
 * 1. Aplica a migration 006 (campos de personalização)
 * 2. Cria a empresa "vistoriapremium"
 *
 * Uso no Render:
 *   node setup-complete.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function setup() {
  console.log('\n🚀 Configuração Completa do Sistema\n');
  console.log('='.repeat(50));

  try {
    // 1. Aplicar Migration 006
    console.log('\n📦 PASSO 1: Aplicando Migration 006...\n');

    const migrationPath = path.join(__dirname, 'src', 'migrations', '006_fix_and_customization.sql');

    if (!fs.existsSync(migrationPath)) {
      console.log('⚠️  Migration 006 não encontrada, pulando...');
    } else {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await db.query(migrationSQL);
      console.log('✅ Migration 006 aplicada com sucesso!');
    }

    // 2. Criar empresa Vistoria Premium
    console.log('\n🏢 PASSO 2: Criando empresa Vistoria Premium...\n');

    const empresaSQL = `
      INSERT INTO empresas (
        nome, slug, email, telefone, chave_pix, status, plano,
        preco_cautelar, preco_transferencia, preco_outros,
        horario_inicio, horario_fim, intervalo_minutos,
        cor_primaria, cor_secundaria, cor_texto, cor_fundo,
        titulo_hero, subtitulo_hero,
        google_rating, google_reviews_count, mostrar_avaliacoes,
        whatsapp_numero, mostrar_whatsapp_float,
        percentual_plataforma, data_inicio
      ) VALUES (
        'Vistoria Premium',
        'vistoriapremium',
        'contato@vistoriapremium.com.br',
        '(67) 99999-9999',
        'contato@vistoriapremium.com.br',
        'ativo',
        'premium',
        15000, 12000, 10000,
        '08:00:00', '18:00:00', 60,
        '#1976d2', '#424242', '#333333', '#ffffff',
        'Vistoria Premium - Excelência em Vistorias Veiculares',
        'Agende sua vistoria com os melhores profissionais do mercado',
        5.0, 150, true,
        '5567999999999', true,
        500, CURRENT_DATE
      )
      ON CONFLICT (slug) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, nome, slug, email, status;
    `;

    const result = await db.query(empresaSQL);
    const empresa = result.rows[0];

    console.log('✅ Empresa criada/atualizada:');
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Nome: ${empresa.nome}`);
    console.log(`   Slug: ${empresa.slug}`);
    console.log(`   Email: ${empresa.email}`);
    console.log(`   Status: ${empresa.status}`);

    // 3. Verificar estrutura
    console.log('\n🔍 PASSO 3: Verificando estrutura do banco...\n');

    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('empresas', 'pagamento_splits', 'empresa_metricas')
      ORDER BY table_name
    `);

    console.log('📋 Tabelas verificadas:');
    tables.rows.forEach(t => {
      console.log(`   ✓ ${t.table_name}`);
    });

    // 4. Testar endpoint
    console.log('\n🧪 PASSO 4: Informações de teste...\n');
    console.log('📍 URLs para testar:');
    console.log(`   Frontend: https://agendaaquivistorias.com.br/${empresa.slug}`);
    console.log(`   API: https://seu-backend.onrender.com/api/tenant/config?slug=${empresa.slug}`);
    console.log('\n💡 Teste no navegador:');
    console.log(`   curl "https://seu-backend.onrender.com/api/tenant/config?slug=${empresa.slug}"`);

    // 5. Listar todas as empresas
    console.log('\n📊 PASSO 5: Empresas no sistema...\n');
    const empresas = await db.query(`
      SELECT id, nome, slug, status, email, created_at
      FROM empresas
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('🏢 Empresas cadastradas:');
    console.log('='.repeat(80));
    console.log('ID'.padEnd(5), 'Nome'.padEnd(30), 'Slug'.padEnd(20), 'Status'.padEnd(10));
    console.log('='.repeat(80));
    empresas.rows.forEach(e => {
      console.log(
        String(e.id).padEnd(5),
        e.nome.padEnd(30).substring(0, 30),
        e.slug.padEnd(20).substring(0, 20),
        e.status.padEnd(10)
      );
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ CONFIGURAÇÃO COMPLETA!\n');
    console.log('🎉 Sistema pronto para uso!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO durante configuração:', error.message);
    console.error('\n📝 Stack trace:', error.stack);

    console.error('\n💡 Possíveis soluções:');
    console.error('   1. Verifique se DATABASE_URL está configurada');
    console.error('   2. Execute primeiro: npm run migrate:postgres');
    console.error('   3. Verifique permissões no banco de dados\n');

    process.exit(1);
  }
}

setup();
