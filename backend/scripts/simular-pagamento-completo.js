/**
 * SIMULAÇÃO COMPLETA DO FLUXO DE PAGAMENTO E REPASSE
 *
 * Cenário:
 * 1. Empresa "Vistoria Teste" cadastra vistoria por R$ 150,00
 * 2. Cliente João paga pela vistoria
 * 3. Sistema processa o split:
 *    - Taxa plataforma (sua parte): R$ 5,00
 *    - Repasse empresa: R$ 145,00
 * 4. Sistema tenta transferir PIX via Asaas
 *
 * Execução: node scripts/simular-pagamento-completo.js
 */

require('dotenv').config();

const db = require('../src/config/database');
const SplitPaymentService = require('../src/services/splitPayment');
const { getInstance: getAsaasService } = require('../src/services/AsaasService');

// Cores para console
const c = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(cor, msg) {
  console.log(`${c[cor]}${msg}${c.reset}`);
}

function separador(titulo) {
  log('cyan', `\n${'═'.repeat(60)}`);
  log('cyan', `  ${titulo}`);
  log('cyan', `${'═'.repeat(60)}\n`);
}

// Configuração do teste
const CONFIG_TESTE = {
  // Valor que a empresa definiu para a vistoria
  valorVistoria: 15000, // R$ 150,00 em centavos

  // Taxa da plataforma (sua parte)
  taxaPlataforma: 500, // R$ 5,00 em centavos

  // Chave PIX da empresa (para onde vai o repasse)
  // Use um CPF/email/telefone válido para teste no sandbox
  chavePix: '12345678901', // CPF de teste

  // Dados da empresa de teste
  empresa: {
    nome: 'Vistoria Veicular Teste',
    slug: 'vistoria-teste-' + Date.now(),
    email: 'teste@vistoriateste.com',
    telefone: '11999999999'
  },

  // Dados do cliente
  cliente: {
    nome: 'João da Silva',
    email: 'joao@email.com',
    telefone: '11988888888'
  }
};

async function criarEmpresaTeste() {
  separador('PASSO 1: CRIAR EMPRESA DE TESTE');

  log('azul', `📝 Criando empresa: ${CONFIG_TESTE.empresa.nome}`);
  log('azul', `   Preço da vistoria: R$ ${(CONFIG_TESTE.valorVistoria / 100).toFixed(2)}`);
  log('azul', `   Taxa plataforma: R$ ${(CONFIG_TESTE.taxaPlataforma / 100).toFixed(2)}`);
  log('azul', `   Chave PIX: ${CONFIG_TESTE.chavePix}`);

  const result = await db.query(`
    INSERT INTO empresas (
      nome, slug, email, telefone,
      preco_cautelar, preco_transferencia, preco_outros,
      chave_pix, percentual_plataforma, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativo')
    RETURNING *
  `, [
    CONFIG_TESTE.empresa.nome,
    CONFIG_TESTE.empresa.slug,
    CONFIG_TESTE.empresa.email,
    CONFIG_TESTE.empresa.telefone,
    CONFIG_TESTE.valorVistoria,
    CONFIG_TESTE.valorVistoria,
    CONFIG_TESTE.valorVistoria,
    CONFIG_TESTE.chavePix,
    CONFIG_TESTE.taxaPlataforma
  ]);

  const empresa = result.rows[0];
  log('verde', `\n✅ Empresa criada com ID: ${empresa.id}`);

  return empresa;
}

async function criarAgendamentoTeste(empresaId) {
  separador('PASSO 2: CLIENTE AGENDA VISTORIA');

  log('azul', `👤 Cliente: ${CONFIG_TESTE.cliente.nome}`);
  log('azul', `📅 Agendando vistoria...`);

  // Primeiro criar o cliente
  const clienteResult = await db.query(`
    INSERT INTO clientes (nome, email, telefone, empresa_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [
    CONFIG_TESTE.cliente.nome,
    CONFIG_TESTE.cliente.email,
    CONFIG_TESTE.cliente.telefone,
    empresaId
  ]);

  const cliente = clienteResult.rows[0];

  // Criar agendamento
  const dataAgendamento = new Date();
  dataAgendamento.setDate(dataAgendamento.getDate() + 1);

  const agendResult = await db.query(`
    INSERT INTO agendamentos (
      empresa_id, cliente_id, data_hora, tipo_vistoria,
      status, preco
    ) VALUES ($1, $2, $3, $4, 'pendente', $5)
    RETURNING *
  `, [
    empresaId,
    cliente.id,
    dataAgendamento.toISOString(),
    'cautelar',
    CONFIG_TESTE.valorVistoria
  ]);

  const agendamento = agendResult.rows[0];

  log('verde', `\n✅ Agendamento criado!`);
  log('verde', `   ID: ${agendamento.id}`);
  log('verde', `   Tipo: Vistoria Cautelar`);
  log('verde', `   Valor: R$ ${(CONFIG_TESTE.valorVistoria / 100).toFixed(2)}`);

  return { cliente, agendamento };
}

async function simularPagamentoAprovado(empresaId, agendamentoId) {
  separador('PASSO 3: CLIENTE PAGA VIA PIX');

  log('azul', `💳 Gerando pagamento PIX...`);
  log('azul', `   Valor: R$ ${(CONFIG_TESTE.valorVistoria / 100).toFixed(2)}`);

  // Criar pagamento com status "approved" (como se viesse do Mercado Pago)
  const result = await db.query(`
    INSERT INTO pagamentos (
      agendamento_id, empresa_id, mp_payment_id,
      metodo_pagamento, valor_total, status,
      dados_pagamento, pago_em
    ) VALUES ($1, $2, $3, 'pix', $4, 'approved', $5, CURRENT_TIMESTAMP)
    RETURNING *
  `, [
    agendamentoId,
    empresaId,
    'TESTE_' + Date.now(), // Simula ID do Mercado Pago
    CONFIG_TESTE.valorVistoria,
    JSON.stringify({
      tipo: 'simulacao_teste',
      data: new Date().toISOString(),
      cliente: CONFIG_TESTE.cliente.nome
    })
  ]);

  const pagamento = result.rows[0];

  log('verde', `\n✅ Pagamento aprovado!`);
  log('verde', `   ID Pagamento: ${pagamento.id}`);
  log('verde', `   Status: ${pagamento.status}`);
  log('verde', `   Valor: R$ ${(pagamento.valor_total / 100).toFixed(2)}`);

  return pagamento;
}

async function processarSplit(pagamentoId) {
  separador('PASSO 4: PROCESSANDO SPLIT DE PAGAMENTO');

  log('amarelo', `⚙️  Calculando divisão do pagamento...`);
  log('amarelo', `   Valor Total: R$ ${(CONFIG_TESTE.valorVistoria / 100).toFixed(2)}`);
  log('amarelo', `   Taxa Plataforma: R$ ${(CONFIG_TESTE.taxaPlataforma / 100).toFixed(2)}`);
  log('amarelo', `   Valor Empresa: R$ ${((CONFIG_TESTE.valorVistoria - CONFIG_TESTE.taxaPlataforma) / 100).toFixed(2)}`);

  try {
    const resultado = await SplitPaymentService.processar(pagamentoId);

    log('verde', `\n✅ Split processado com sucesso!`);
    console.log('\nDetalhes do split:');
    console.log(`   Pagamento ID: ${resultado.pagamento_id}`);
    console.log(`   Valor Total: R$ ${(resultado.valor_total / 100).toFixed(2)}`);
    console.log(`   Taxa (sua parte): R$ ${(resultado.taxa / 100).toFixed(2)}`);
    console.log(`   Valor Empresa: R$ ${(resultado.valor_empresa / 100).toFixed(2)}`);
    console.log(`   Transação Repasse ID: ${resultado.transacao_repasse_id}`);

    return resultado;

  } catch (error) {
    log('vermelho', `\n❌ Erro ao processar split: ${error.message}`);
    throw error;
  }
}

async function verificarResultado(resultado) {
  separador('PASSO 5: VERIFICANDO REPASSE');

  if (resultado.repasse_automatico) {
    const repasse = resultado.repasse_automatico;

    if (repasse.sucesso) {
      log('verde', `\n🎉 REPASSE REALIZADO COM SUCESSO!`);
      console.log(`   Tipo: ${repasse.tipo}`);
      console.log(`   Comprovante: ${repasse.comprovante}`);
      console.log(`   Ambiente: ${repasse.ambiente}`);
      console.log(`   Status: ${repasse.status}`);
    } else {
      log('amarelo', `\n⚠️  Repasse não realizado:`);
      console.log(`   Motivo: ${repasse.erro}`);

      // Verificar se é problema de saldo
      const asaas = getAsaasService();
      if (asaas.isReady()) {
        try {
          const { saldo, saldo_formatado } = await asaas.getSaldo();
          console.log(`   Saldo Asaas: ${saldo_formatado}`);

          if (saldo < (CONFIG_TESTE.valorVistoria - CONFIG_TESTE.taxaPlataforma) / 100) {
            log('amarelo', `\n💡 O saldo na conta Asaas é insuficiente para o repasse.`);
            log('amarelo', `   Para testar o repasse real, adicione saldo no sandbox:`);
            log('amarelo', `   https://sandbox.asaas.com`);
          }
        } catch (e) {
          console.log(`   Erro ao consultar saldo: ${e.message}`);
        }
      }
    }
  }

  // Mostrar transações criadas
  separador('TRANSAÇÕES REGISTRADAS');

  const transacoes = await db.query(`
    SELECT * FROM transacoes
    WHERE pagamento_id = $1
    ORDER BY tipo
  `, [resultado.pagamento_id]);

  for (const t of transacoes.rows) {
    const icon = t.tipo === 'taxa' ? '💰' : '💸';
    const destino = t.tipo === 'taxa' ? 'PLATAFORMA' : 'EMPRESA';
    console.log(`\n${icon} ${t.tipo.toUpperCase()} → ${destino}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Valor: R$ ${(t.valor / 100).toFixed(2)}`);
    console.log(`   Status: ${t.status}`);
    if (t.pix_key) console.log(`   PIX: ${t.pix_key}`);
    if (t.pix_status) console.log(`   PIX Status: ${t.pix_status}`);
  }
}

async function limparDadosTeste(empresaId, agendamentoId, pagamentoId) {
  separador('LIMPANDO DADOS DE TESTE');

  log('amarelo', '🧹 Removendo dados de teste...');

  // Remover transações
  await db.query('DELETE FROM transacoes WHERE pagamento_id = $1', [pagamentoId]);

  // Remover pagamento
  await db.query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);

  // Remover agendamento
  await db.query('DELETE FROM agendamentos WHERE id = $1', [agendamentoId]);

  // Remover cliente
  await db.query('DELETE FROM clientes WHERE empresa_id = $1', [empresaId]);

  // Remover empresa
  await db.query('DELETE FROM empresas WHERE id = $1', [empresaId]);

  log('verde', '✅ Dados de teste removidos!');
}

async function main() {
  console.log('\n');
  log('magenta', '╔════════════════════════════════════════════════════════════╗');
  log('magenta', '║  SIMULAÇÃO COMPLETA: PAGAMENTO + SPLIT + REPASSE PIX      ║');
  log('magenta', '╚════════════════════════════════════════════════════════════╝');

  let empresa = null;
  let agendamento = null;
  let pagamento = null;

  try {
    // Verificar conexão com banco
    log('azul', '\n📡 Verificando conexão com banco de dados...');
    await db.query('SELECT 1');
    log('verde', '✅ Banco de dados conectado!\n');

    // Verificar Asaas
    const asaas = getAsaasService();
    log('azul', '📡 Verificando conexão com Asaas...');
    if (asaas.isReady()) {
      const { saldo_formatado } = await asaas.getSaldo();
      log('verde', `✅ Asaas conectado! Saldo: ${saldo_formatado}`);
      log('amarelo', `   Ambiente: ${asaas.sandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
    } else {
      log('amarelo', '⚠️  Asaas não configurado - repasse será simulado');
    }

    // Executar simulação
    empresa = await criarEmpresaTeste();
    const { agendamento: agend } = await criarAgendamentoTeste(empresa.id);
    agendamento = agend;
    pagamento = await simularPagamentoAprovado(empresa.id, agendamento.id);
    const resultado = await processarSplit(pagamento.id);
    await verificarResultado(resultado);

    // Resumo final
    separador('RESUMO DA SIMULAÇÃO');

    log('verde', '✅ Fluxo completo executado com sucesso!\n');
    console.log('📊 O que aconteceu:');
    console.log(`   1. Empresa "${empresa.nome}" cadastrou vistoria por R$ ${(CONFIG_TESTE.valorVistoria / 100).toFixed(2)}`);
    console.log(`   2. Cliente pagou R$ ${(CONFIG_TESTE.valorVistoria / 100).toFixed(2)} via PIX`);
    console.log(`   3. Sistema calculou split:`);
    console.log(`      - Sua taxa: R$ ${(CONFIG_TESTE.taxaPlataforma / 100).toFixed(2)} (fica na sua conta)`);
    console.log(`      - Empresa: R$ ${((CONFIG_TESTE.valorVistoria - CONFIG_TESTE.taxaPlataforma) / 100).toFixed(2)} (repasse PIX)`);
    console.log(`   4. Repasse via Asaas: ${resultado.repasse_automatico?.sucesso ? '✅ Realizado' : '⏳ Pendente (sem saldo no sandbox)'}`);

    // Perguntar se quer manter os dados
    console.log('\n');
    log('amarelo', '🗑️  Os dados de teste serão removidos automaticamente.');
    log('amarelo', '   (Em produção, os dados ficam no banco normalmente)');

  } catch (error) {
    log('vermelho', `\n❌ Erro na simulação: ${error.message}`);
    console.error(error);
  } finally {
    // Limpar dados de teste
    if (empresa && agendamento && pagamento) {
      await limparDadosTeste(empresa.id, agendamento.id, pagamento.id);
    }

    console.log('\n');
    log('cyan', '════════════════════════════════════════════════════════════');
    log('cyan', '  FIM DA SIMULAÇÃO');
    log('cyan', '════════════════════════════════════════════════════════════\n');

    process.exit(0);
  }
}

main();
