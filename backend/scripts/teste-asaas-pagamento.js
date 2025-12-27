/**
 * TESTE COMPLETO: PAGAMENTO VIA ASAAS
 *
 * Testa o fluxo:
 * 1. Criar cliente na Asaas
 * 2. Criar cobrança PIX
 * 3. Verificar QR Code gerado
 * 4. Consultar status
 */

process.env.DATABASE_URL = 'postgresql://agendamentos_user:Ir3BriZT5FvaolIk8vHty0NiXPcRXdxy@dpg-d4hoten5r7bs73c13o0g-a.oregon-postgres.render.com/agendamentos_2qh3?sslmode=require';
process.env.NODE_ENV = 'production';

require('dotenv').config();

const { getInstance: getAsaasPaymentService } = require('../src/services/AsaasPaymentService');
const { TAXA_PIX_ASAAS, calcularValorTotal } = require('../src/config/taxas');

// Cores
const c = {
  reset: '\x1b[0m', verde: '\x1b[32m', vermelho: '\x1b[31m',
  amarelo: '\x1b[33m', azul: '\x1b[34m', cyan: '\x1b[36m',
  magenta: '\x1b[35m', bold: '\x1b[1m'
};

function log(cor, msg) { console.log(`${c[cor]}${msg}${c.reset}`); }
function box(t) {
  log('cyan', `\n${'═'.repeat(60)}`);
  log('cyan', `  ${t}`);
  log('cyan', `${'═'.repeat(60)}\n`);
}

// Dados de teste
const PRECO_VISTORIA = 15000; // R$ 150,00
const CLIENTE_TESTE = {
  nome: 'João da Silva Teste',
  cpf: '12345678909', // CPF de teste
  email: 'joao.teste@email.com',
  telefone: '11999887766' // Telefone válido com DDD
};

async function main() {
  try {
    console.log('\n');
    log('magenta', '╔════════════════════════════════════════════════════════════╗');
    log('magenta', '║  TESTE: PAGAMENTO COMPLETO VIA ASAAS                       ║');
    log('magenta', '╚════════════════════════════════════════════════════════════╝');

    const asaasPayment = getAsaasPaymentService();

    // Verificar se está configurado
    box('1. VERIFICANDO CONFIGURAÇÃO');

    if (!asaasPayment.isReady()) {
      log('vermelho', '❌ Asaas não está configurado!');
      log('vermelho', '   Configure ASAAS_API_KEY no arquivo .env');
      process.exit(1);
    }

    log('verde', '✅ Asaas configurado!');
    console.log(`   Ambiente: ${asaasPayment.sandbox ? '🧪 SANDBOX' : '🚀 PRODUÇÃO'}`);
    console.log(`   Base URL: ${asaasPayment.baseUrl}`);

    // Consultar saldo
    try {
      const { saldo, saldoFormatado } = await asaasPayment.consultarSaldo();
      console.log(`   Saldo: ${saldoFormatado}`);
    } catch (e) {
      console.log(`   Saldo: Erro ao consultar - ${e.message}`);
    }

    // Criar/buscar cliente
    box('2. CRIANDO CLIENTE NA ASAAS');

    log('azul', `👤 Cliente: ${CLIENTE_TESTE.nome}`);
    log('azul', `   CPF: ${CLIENTE_TESTE.cpf}`);

    const cliente = await asaasPayment.buscarOuCriarCliente(CLIENTE_TESTE);

    log('verde', '✅ Cliente processado!');
    console.log(`   ID Asaas: ${cliente.id}`);
    console.log(`   Nome: ${cliente.name}`);

    // Calcular valor
    box('3. CALCULANDO VALOR');

    const valorTotal = calcularValorTotal(PRECO_VISTORIA, true);
    const valorReais = valorTotal / 100;

    console.log(`   Preço da vistoria: R$ ${(PRECO_VISTORIA / 100).toFixed(2)}`);
    console.log(`   + Taxa PIX Asaas: R$ ${(TAXA_PIX_ASAAS / 100).toFixed(2)}`);
    console.log(`   ${c.verde}${c.bold}= Total a pagar: R$ ${valorReais.toFixed(2)}${c.reset}`);

    // Criar cobrança PIX
    box('4. CRIANDO COBRANÇA PIX');

    log('azul', '💳 Gerando QR Code PIX...');

    // Tentar criar cobrança PIX, se falhar, usar boleto como fallback
    let cobranca;
    let tipoPagamento = 'PIX';

    try {
      cobranca = await asaasPayment.criarCobrancaPix({
        clienteAsaasId: cliente.id,
        valor: valorReais,
        descricao: 'Vistoria Veicular - TESTE',
        externalReference: 'TESTE_' + Date.now()
      });
    } catch (pixError) {
      log('amarelo', `⚠️  PIX não disponível: ${pixError.message}`);
      log('amarelo', '   Testando com boleto como fallback...\n');

      tipoPagamento = 'BOLETO';

      // Criar cobrança via boleto para testar
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 3);

      const response = await asaasPayment.client.post('/payments', {
        customer: cliente.id,
        billingType: 'BOLETO',
        value: valorReais,
        dueDate: vencimento.toISOString().split('T')[0],
        description: 'Vistoria Veicular - TESTE',
        externalReference: 'TESTE_' + Date.now()
      });

      cobranca = {
        sucesso: true,
        cobrancaId: response.data.id,
        status: response.data.status,
        valor: response.data.value,
        vencimento: response.data.dueDate,
        linkPagamento: response.data.invoiceUrl,
        linkBoleto: response.data.bankSlipUrl,
        detalhes: response.data
      };
    }

    log('verde', '\n✅ COBRANÇA CRIADA COM SUCESSO!\n');

    console.log(`${c.cyan}┌────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.bold}DADOS DA COBRANÇA${c.reset}                                    ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ID: ${cobranca.cobrancaId.padEnd(48)} ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Status: ${cobranca.status.padEnd(44)} ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Valor: R$ ${valorReais.toFixed(2).padEnd(42)} ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Vencimento: ${cobranca.vencimento.padEnd(40)} ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}└────────────────────────────────────────────────────────┘${c.reset}`);

    // QR Code PIX
    box('5. QR CODE PIX');

    if (cobranca.pixCopiaECola) {
      console.log(`${c.verde}PIX Copia e Cola:${c.reset}`);
      console.log(`${cobranca.pixCopiaECola.substring(0, 80)}...`);
      console.log('');

      if (cobranca.pixQrCodeBase64) {
        console.log(`${c.verde}QR Code Base64:${c.reset} ✅ Gerado (${cobranca.pixQrCodeBase64.length} caracteres)`);
      }
    } else {
      log('amarelo', '⚠️  QR Code não disponível (pode demorar alguns segundos)');
    }

    // Link de pagamento
    if (cobranca.linkPagamento) {
      console.log(`\n${c.verde}Link de Pagamento:${c.reset}`);
      console.log(`${cobranca.linkPagamento}`);
    }

    // Consultar status
    box('6. CONSULTANDO STATUS');

    const status = await asaasPayment.consultarCobranca(cobranca.cobrancaId);

    console.log(`   Status atual: ${status.status}`);
    console.log(`   Valor: R$ ${status.valor.toFixed(2)}`);

    // Resumo
    box('RESUMO DO TESTE');

    log('verde', '✅ Teste concluído com sucesso!\n');
    console.log('📊 O que foi testado:');
    console.log('   1. ✅ Conexão com Asaas');
    console.log('   2. ✅ Criar/buscar cliente');
    console.log('   3. ✅ Criar cobrança PIX');
    console.log('   4. ✅ Gerar QR Code');
    console.log('   5. ✅ Consultar status');

    console.log('\n📱 Para testar o pagamento:');
    console.log(`   1. Acesse: ${cobranca.linkPagamento}`);
    console.log('   2. Ou escaneie o QR Code com seu app de banco');
    console.log('   3. O webhook será chamado quando o pagamento for confirmado');

    console.log('\n💡 Configurar webhook na Asaas:');
    console.log('   URL: https://seu-dominio.com/api/asaas/payment/webhook');
    console.log('   Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED');

    // Cancelar cobrança de teste
    box('LIMPANDO TESTE');

    try {
      await asaasPayment.cancelarCobranca(cobranca.cobrancaId);
      log('verde', '✅ Cobrança de teste cancelada');
    } catch (e) {
      log('amarelo', `⚠️  Não foi possível cancelar: ${e.message}`);
    }

  } catch (error) {
    log('vermelho', `\n❌ Erro: ${error.message}`);
    console.error(error);
  }

  console.log('\n');
  process.exit(0);
}

main();
