/**
 * Script para aplicar a migration de precos de vistoria
 * Execute com: node backend/scripts/aplicar-precos-vistoria.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function aplicarMigration() {
  console.log('🔄 Aplicando migration de precos de vistoria...\n');

  try {
    // 1. Criar tabela precos_vistoria
    console.log('📦 Criando tabela precos_vistoria...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS precos_vistoria (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        categoria VARCHAR(50) NOT NULL,
        nome_exibicao VARCHAR(100) NOT NULL,
        descricao TEXT,
        preco INTEGER NOT NULL,
        ordem INTEGER DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(empresa_id, categoria)
      )
    `);
    console.log('✅ Tabela precos_vistoria criada\n');

    // 2. Criar indices
    console.log('📦 Criando indices...');
    await db.query(`CREATE INDEX IF NOT EXISTS idx_precos_vistoria_empresa ON precos_vistoria(empresa_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_precos_vistoria_categoria ON precos_vistoria(categoria)`);
    console.log('✅ Indices criados\n');

    // 3. Verificar e criar trigger
    console.log('📦 Verificando trigger...');
    try {
      await db.query(`
        CREATE OR REPLACE TRIGGER update_precos_vistoria_updated_at
        BEFORE UPDATE ON precos_vistoria
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
      console.log('✅ Trigger criado\n');
    } catch (err) {
      console.log('⚠️ Trigger ja existe ou funcao nao encontrada\n');
    }

    // 4. Adicionar coluna categoria_veiculo na tabela agendamentos
    console.log('📦 Adicionando coluna categoria_veiculo em agendamentos...');
    try {
      await db.query(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS categoria_veiculo VARCHAR(50)`);
      console.log('✅ Coluna categoria_veiculo adicionada\n');
    } catch (err) {
      console.log('⚠️ Coluna categoria_veiculo ja existe\n');
    }

    // 5. Inserir precos padrao para todas as empresas ativas
    console.log('📦 Buscando empresas ativas...');
    const empresasResult = await db.query(`SELECT id, nome FROM empresas WHERE status = 'ativo'`);
    const empresas = empresasResult.rows;
    console.log(`   Encontradas ${empresas.length} empresas ativas\n`);

    const categoriasPadrao = [
      { categoria: 'moto_pequena', nome_exibicao: 'Motos até 200cc', descricao: 'Motocicletas com cilindrada até 200cc', preco: 19000, ordem: 1 },
      { categoria: 'moto_grande_automovel', nome_exibicao: 'Motos +200cc / Automóveis', descricao: 'Motocicletas acima de 200cc e automóveis de passeio', preco: 22000, ordem: 2 },
      { categoria: 'camionete', nome_exibicao: 'Camionetes / Camionetas', descricao: 'Veículos utilitários como picapes e SUVs', preco: 23000, ordem: 3 },
      { categoria: 'van_microonibus', nome_exibicao: 'Vans / Micro-ônibus', descricao: 'Vans, motorhomes e micro-ônibus', preco: 25000, ordem: 4 },
      { categoria: 'caminhao_onibus', nome_exibicao: 'Caminhões / Ônibus', descricao: 'Caminhões, carretas e ônibus de grande porte', preco: 28000, ordem: 5 }
    ];

    for (const empresa of empresas) {
      console.log(`📦 Inserindo precos para: ${empresa.nome} (ID: ${empresa.id})`);

      for (const cat of categoriasPadrao) {
        try {
          await db.query(`
            INSERT INTO precos_vistoria (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            ON CONFLICT (empresa_id, categoria) DO NOTHING
          `, [empresa.id, cat.categoria, cat.nome_exibicao, cat.descricao, cat.preco, cat.ordem]);
        } catch (err) {
          // Ignora se ja existe
        }
      }

      console.log(`   ✅ Precos inseridos para ${empresa.nome}\n`);
    }

    console.log('🎉 Migration aplicada com sucesso!\n');
    console.log('Categorias de veiculos disponiveis:');
    console.log('  - moto_pequena: Motos até 200cc - R$ 190,00');
    console.log('  - moto_grande_automovel: Motos +200cc / Automóveis - R$ 220,00');
    console.log('  - camionete: Camionetes / Camionetas - R$ 230,00');
    console.log('  - van_microonibus: Vans / Micro-ônibus - R$ 250,00');
    console.log('  - caminhao_onibus: Caminhões / Ônibus - R$ 280,00');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

aplicarMigration();
