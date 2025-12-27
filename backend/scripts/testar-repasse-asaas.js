/**
 * Script de teste para o sistema de repasses via Asaas
 * Executa: node scripts/testar-repasse-asaas.js
 */

require('dotenv').config();

const { getInstance: getAsaasService } = require('../src/services/AsaasService');
const PixTransferService = require('../src/services/PixTransferService');

// Cores para console
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(cor, msg) {
  console.log(`${cores[cor]}${msg}${cores.reset}`);
}

// Cenários de teste com diferentes tipos de vistoria
const cenariosTeste = [
  {
    nome: 'Vistoria Cautelar - Carro',
    valorTotal: 35000, // R$ 350,00 em centavos
    taxaPlataforma: 500, // R$ 5,00
    empresaNome: 'Vistoria Express',
    chavePix: '12345678901' // CPF teste
  },
  {
    nome: 'Vistoria Transferência - Moto',
    valorTotal: 22000, // R$ 220,00 em centavos
    taxaPlataforma: 500,
    empresaNome: 'Vistoria Express',
    chavePix: '12345678901'
  },
  {
    nome: 'Vistoria Outros - Caminhão',
    valorTotal: 50000, // R$ 500,00 em centavos
    taxaPlataforma: 1000, // R$ 10,00 (taxa maior)
    empresaNome: 'Vistoria Premium',
    chavePix: 'teste@email.com'
  },
  {
    nome: 'Valor Personalizado pelo Cliente',
    valorTotal: 28500, // R$ 285,00 em centavos
    taxaPlataforma: 750, // R$ 7,50
    empresaNome: 'Vistoria Custom',
    chavePix: '+5511999999999'
  }
];

async function testarConexaoAsaas() {
  log('cyan', '\n════════════════════════════════════════════════════════');
  log('cyan', '  TESTE DE CONEXÃO COM ASAAS');
  log('cyan', '════════════════════════════════════════════════════════\n');

  const asaas = getAsaasService();

  console.log('Configuração:');
  console.log(`  - API Key configurada: ${asaas.apiKey ? '✅ Sim' : '❌ Não'}`);
  console.log(`  - Ambiente: ${asaas.sandbox ? '🧪 SANDBOX' : '🚀 PRODUÇÃO'}`);
  console.log(`  - Base URL: ${asaas.baseUrl}`);
  console.log(`  - Inicializado: ${asaas.initialized ? '✅ Sim' : '❌ Não'}`);

  if (!asaas.initialized) {
    log('vermelho', '\n❌ Asaas não está configurado! Configure ASAAS_API_KEY no .env');
    return false;
  }

  try {
    log('amarelo', '\n📡 Consultando saldo na conta Asaas...');
    const { saldo, saldo_formatado } = await asaas.getSaldo();
    log('verde', `\n✅ Conexão OK! Saldo disponível: ${saldo_formatado}`);
    return { sucesso: true, saldo };
  } catch (error) {
    log('vermelho', `\n❌ Erro ao conectar: ${error.message}`);
    return { sucesso: false, erro: error.message };
  }
}

async function simularCenarios() {
  log('cyan', '\n════════════════════════════════════════════════════════');
  log('cyan', '  SIMULAÇÃO DE CENÁRIOS DE REPASSE');
  log('cyan', '════════════════════════════════════════════════════════\n');

  console.log('📋 Cenários de teste (valores calculados, sem transferência real):\n');

  for (let i = 0; i < cenariosTeste.length; i++) {
    const cenario = cenariosTeste[i];
    const valorEmpresa = cenario.valorTotal - cenario.taxaPlataforma;

    log('azul', `\n─────────────────────────────────────────────────────────`);
    log('azul', `  CENÁRIO ${i + 1}: ${cenario.nome}`);
    log('azul', `─────────────────────────────────────────────────────────`);

    console.log(`  Valor Total:        R$ ${(cenario.valorTotal / 100).toFixed(2)}`);
    console.log(`  Taxa Plataforma:    R$ ${(cenario.taxaPlataforma / 100).toFixed(2)}`);
    console.log(`  Valor Empresa:      R$ ${(valorEmpresa / 100).toFixed(2)}`);
    console.log(`  Empresa:            ${cenario.empresaNome}`);
    console.log(`  Chave PIX:          ${cenario.chavePix}`);
    console.log(`  % Plataforma:       ${((cenario.taxaPlataforma / cenario.valorTotal) * 100).toFixed(2)}%`);
    console.log(`  % Empresa:          ${((valorEmpresa / cenario.valorTotal) * 100).toFixed(2)}%`);
  }
}

async function testarTransferenciaPix(executarReal = false) {
  log('cyan', '\n════════════════════════════════════════════════════════');
  log('cyan', '  TESTE DO SERVIÇO PIX TRANSFER');
  log('cyan', '════════════════════════════════════════════════════════\n');

  const pixService = new PixTransferService();
  const status = pixService.getStatus();

  console.log('Status do serviço:');
  console.log(`  - Operacional: ${status.operacional ? '✅' : '❌'}`);
  console.log(`  - Modo: ${status.modo}`);
  console.log(`  - Asaas configurado: ${status.asaas_configurado ? '✅' : '❌'}`);
  console.log(`  - Ambiente: ${status.ambiente}`);

  if (executarReal) {
    log('amarelo', '\n⚠️  ATENÇÃO: Executando transferência REAL no sandbox!\n');

    // Usando um cenário de teste
    const cenario = cenariosTeste[0];
    const valorEmpresa = cenario.valorTotal - cenario.taxaPlataforma;

    const resultado = await pixService.transferirPix({
      chave_pix: cenario.chavePix,
      valor: valorEmpresa,
      empresa_nome: cenario.empresaNome,
      empresa_id: 1,
      split_id: 999
    });

    if (resultado.sucesso) {
      log('verde', '\n✅ Transferência realizada com sucesso!');
      console.log('Detalhes:', JSON.stringify(resultado, null, 2));
    } else {
      log('vermelho', '\n❌ Falha na transferência:');
      console.log('Erro:', resultado.mensagem || resultado.erro);
    }

    return resultado;
  }

  return status;
}

async function verificarChavesPix() {
  log('cyan', '\n════════════════════════════════════════════════════════');
  log('cyan', '  VALIDAÇÃO DE CHAVES PIX');
  log('cyan', '════════════════════════════════════════════════════════\n');

  const asaas = getAsaasService();

  const chavesTeste = [
    { chave: '12345678901', esperado: 'CPF' },
    { chave: '12345678901234', esperado: 'CNPJ' },
    { chave: 'teste@email.com', esperado: 'EMAIL' },
    { chave: '+5511999999999', esperado: 'PHONE' },
    { chave: '123e4567-e89b-12d3-a456-426614174000', esperado: 'EVP' }
  ];

  console.log('Testando detecção de tipos de chave PIX:\n');

  for (const teste of chavesTeste) {
    const tipo = asaas.detectarTipoChavePix(teste.chave);
    const ok = tipo === teste.esperado;
    const status = ok ? '✅' : '❌';
    console.log(`  ${status} ${teste.chave.padEnd(40)} → ${tipo} (esperado: ${teste.esperado})`);
  }
}

async function main() {
  console.log('\n');
  log('verde', '╔══════════════════════════════════════════════════════════╗');
  log('verde', '║     TESTE DO SISTEMA DE REPASSES - ASAAS PIX            ║');
  log('verde', '╚══════════════════════════════════════════════════════════╝');

  // 1. Testar conexão
  const conexao = await testarConexaoAsaas();

  // 2. Verificar validação de chaves PIX
  await verificarChavesPix();

  // 3. Simular cenários
  await simularCenarios();

  // 4. Testar serviço PIX
  await testarTransferenciaPix(false); // false = não executa transferência real

  // Resumo
  log('cyan', '\n════════════════════════════════════════════════════════');
  log('cyan', '  RESUMO DO TESTE');
  log('cyan', '════════════════════════════════════════════════════════\n');

  if (conexao.sucesso) {
    log('verde', '✅ Conexão com Asaas: OK');
    log('verde', `   Saldo disponível: R$ ${conexao.saldo?.toFixed(2) || '0.00'}`);
  } else {
    log('vermelho', '❌ Conexão com Asaas: FALHOU');
    log('vermelho', `   Erro: ${conexao.erro || 'Não configurado'}`);
  }

  console.log('\n');
  log('amarelo', '💡 Para executar uma transferência real de teste, execute:');
  log('amarelo', '   node scripts/testar-repasse-asaas.js --executar');
  console.log('\n');
}

// Verificar se deve executar transferência real
const executarReal = process.argv.includes('--executar');

if (executarReal) {
  log('vermelho', '\n⚠️  MODO DE EXECUÇÃO REAL ATIVADO!\n');
  testarTransferenciaPix(true).then(() => process.exit(0));
} else {
  main().catch(console.error);
}
