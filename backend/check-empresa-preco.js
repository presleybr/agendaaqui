// Script para verificar preço da empresa no banco
require('dotenv').config();
const db = require('./src/config/database');

async function checkEmpresa() {
  try {
    const result = await db.query(`
      SELECT id, nome, slug, preco_cautelar, preco_transferencia, preco_outros
      FROM empresas
      WHERE slug = 'matriznova'
    `);

    console.log('\n🔍 Dados da empresa matriznova:');
    console.log(JSON.stringify(result.rows[0], null, 2));

    if (result.rows[0]) {
      const empresa = result.rows[0];
      console.log('\n💰 Preços:');
      console.log(`   Cautelar: ${empresa.preco_cautelar} centavos = R$ ${(empresa.preco_cautelar / 100).toFixed(2)}`);
      console.log(`   Transferência: ${empresa.preco_transferencia} centavos = R$ ${(empresa.preco_transferencia / 100).toFixed(2)}`);
      console.log(`   Outros: ${empresa.preco_outros} centavos = R$ ${(empresa.preco_outros / 100).toFixed(2)}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkEmpresa();
