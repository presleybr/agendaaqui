/**
 * TESTE COMPLETO EM PRODUÇÃO
 * Simula fluxo real: Cliente paga R$ 150 → Split → Repasse PIX
 */

// Usar DATABASE_URL do Render com SSL
process.env.DATABASE_URL = 'postgresql://agendamentos_user:Ir3BriZT5FvaolIk8vHty0NiXPcRXdxy@dpg-d4hoten5r7bs73c13o0g-a.oregon-postgres.render.com/agendamentos_2qh3?sslmode=require';
process.env.NODE_ENV = 'production'; // Força SSL no config/database.js

require('dotenv').config();

const db = require('../src/config/database');
const SplitPaymentService = require('../src/services/splitPayment');
const { getInstance: getAsaasService } = require('../src/services/AsaasService');

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

// CONFIGURAÇÃO DO TESTE
const VALOR_VISTORIA = 15000; // R$ 150,00
const EMPRESA_ID = 2; // Agenda Aqui Vistorias - Matriz

async function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let clienteId = null;
  let agendamentoId = null;
  let pagamentoId = null;

  try {
    console.log('\n');
    log('magenta', '╔════════════════════════════════════════════════════════════╗');
    log('magenta', '║  TESTE COMPLETO: PAGAMENTO → SPLIT → REPASSE PIX          ║');
    log('magenta', '╚════════════════════════════════════════════════════════════╝');

    // Aguardar conexão
    log('azul', '\n📡 Conectando ao banco PostgreSQL no Render...');
    await aguardar(2000);

    // Verificar empresa
    box('PASSO 1: VERIFICAR EMPRESA');

    const empresaResult = await db.query('SELECT * FROM empresas WHERE id = $1', [EMPRESA_ID]);
    const empresa = empresaResult.rows[0];

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    log('verde', `✅ Empresa encontrada:`);
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Nome: ${empresa.nome}`);
    console.log(`   Chave PIX: ${empresa.chave_pix}`);
    console.log(`   Taxa Plataforma: R$ ${(empresa.percentual_plataforma / 100).toFixed(2)}`);
    console.log(`   Preço Cautelar: R$ ${(empresa.preco_cautelar / 100).toFixed(2)}`);

    // Criar cliente de teste
    box('PASSO 2: CLIENTE FAZ AGENDAMENTO');

    const clienteNome = `Cliente Teste ${Date.now()}`;
    const clienteEmail = `teste${Date.now()}@teste.com`;

    log('azul', `👤 Criando cliente: ${clienteNome}`);

    const clienteResult = await db.query(`
      INSERT INTO clientes (nome, email, telefone, empresa_id)
      VALUES ($1, $2, '11999999999', $3)
      RETURNING *
    `, [clienteNome, clienteEmail, EMPRESA_ID]);

    clienteId = clienteResult.rows[0].id;
    log('verde', `✅ Cliente criado com ID: ${clienteId}`);

    // Criar agendamento
    log('azul', `📅 Criando agendamento de vistoria por R$ ${(VALOR_VISTORIA / 100).toFixed(2)}...`);

    const dataAgendamento = new Date();
    dataAgendamento.setDate(dataAgendamento.getDate() + 1);
    dataAgendamento.setHours(10, 0, 0, 0);

    const protocolo = `TST${Date.now()}`;

    const agendResult = await db.query(`
      INSERT INTO agendamentos (empresa_id, cliente_id, data_hora, tipo_vistoria, status, valor, protocolo)
      VALUES ($1, $2, $3, 'cautelar', 'pendente', $4, $5)
      RETURNING *
    `, [EMPRESA_ID, clienteId, dataAgendamento.toISOString(), VALOR_VISTORIA, protocolo]);

    agendamentoId = agendResult.rows[0].id;
    log('verde', `✅ Agendamento criado com ID: ${agendamentoId}`);
    console.log(`   Data: ${dataAgendamento.toLocaleString('pt-BR')}`);
    console.log(`   Tipo: Vistoria Cautelar`);
    console.log(`   Valor: R$ ${(VALOR_VISTORIA / 100).toFixed(2)}`);

    // Simular pagamento aprovado
    box('PASSO 3: CLIENTE PAGA VIA PIX');

    log('azul', `💳 Simulando pagamento PIX de R$ ${(VALOR_VISTORIA / 100).toFixed(2)}...`);

    const mpPaymentId = `TESTE_PIX_${Date.now()}`;

    const pagResult = await db.query(`
      INSERT INTO pagamentos (
        agendamento_id, empresa_id, mp_payment_id,
        metodo_pagamento, valor_total, status,
        dados_pagamento, pago_em
      ) VALUES ($1, $2, $3, 'pix', $4, 'approved', $5, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      agendamentoId,
      EMPRESA_ID,
      mpPaymentId,
      VALOR_VISTORIA,
      JSON.stringify({
        tipo: 'teste_simulacao',
        data: new Date().toISOString(),
        cliente: clienteNome
      })
    ]);

    pagamentoId = pagResult.rows[0].id;

    log('verde', `\n✅ PAGAMENTO APROVADO!`);
    console.log(`   ID Pagamento: ${pagamentoId}`);
    console.log(`   MP Payment ID: ${mpPaymentId}`);
    console.log(`   Status: approved`);
    console.log(`   Valor: R$ ${(VALOR_VISTORIA / 100).toFixed(2)}`);

    // Processar split
    box('PASSO 4: PROCESSANDO SPLIT DE PAGAMENTO');

    const taxaPlataforma = empresa.percentual_plataforma || 500;
    const valorEmpresa = VALOR_VISTORIA - taxaPlataforma;

    console.log(`${c.cyan}┌────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  CÁLCULO DO SPLIT                                      ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Valor Total:         R$ ${(VALOR_VISTORIA / 100).toFixed(2).padStart(10)}                  ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.amarelo}Sua Taxa:${c.reset}            R$ ${(taxaPlataforma / 100).toFixed(2).padStart(10)} ${c.amarelo}(fica com você)${c.reset}    ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.verde}Repasse Empresa:${c.reset}     R$ ${(valorEmpresa / 100).toFixed(2).padStart(10)} ${c.verde}(via PIX)${c.reset}          ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}└────────────────────────────────────────────────────────┘${c.reset}`);

    log('amarelo', '\n⚙️  Executando SplitPaymentService.processar()...\n');

    const resultado = await SplitPaymentService.processar(pagamentoId);

    log('verde', `\n✅ SPLIT PROCESSADO COM SUCESSO!`);
    console.log(`   Transação Repasse ID: ${resultado.transacao_repasse_id}`);

    // Verificar resultado do repasse
    box('PASSO 5: RESULTADO DO REPASSE ASAAS');

    if (resultado.repasse_automatico) {
      const repasse = resultado.repasse_automatico;

      if (repasse.sucesso) {
        log('verde', `🎉 REPASSE PIX REALIZADO COM SUCESSO!`);
        console.log(`   Tipo: ${repasse.tipo}`);
        console.log(`   Comprovante: ${repasse.comprovante}`);
        console.log(`   Status: ${repasse.status}`);
        console.log(`   Ambiente: ${repasse.ambiente}`);
      } else {
        log('amarelo', `⚠️  Repasse não realizado automaticamente:`);
        console.log(`   Motivo: ${repasse.erro}`);

        // Verificar saldo
        const asaas = getAsaasService();
        if (asaas.isReady()) {
          try {
            const { saldo_formatado } = await asaas.getSaldo();
            console.log(`   Saldo Asaas: ${saldo_formatado}`);
            log('cyan', `\n💡 Adicione saldo no sandbox Asaas para testar repasse real:`);
            log('cyan', `   https://sandbox.asaas.com`);
          } catch (e) {
            console.log(`   Erro saldo: ${e.message}`);
          }
        }
      }
    }

    // Mostrar transações criadas
    box('TRANSAÇÕES REGISTRADAS NO BANCO');

    const transacoes = await db.query(`
      SELECT * FROM transacoes WHERE pagamento_id = $1 ORDER BY tipo
    `, [pagamentoId]);

    for (const t of transacoes.rows) {
      const icon = t.tipo === 'taxa' ? '💰' : '💸';
      const destino = t.tipo === 'taxa' ? 'SUA CONTA (Plataforma)' : 'CONTA DA EMPRESA';

      console.log(`\n${icon} ${t.tipo.toUpperCase()} → ${destino}`);
      console.log(`   ID Transação: ${t.id}`);
      console.log(`   Valor: R$ ${(t.valor / 100).toFixed(2)}`);
      console.log(`   Status: ${t.status}`);
      if (t.pix_key) console.log(`   PIX Destino: ${t.pix_key}`);
      if (t.pix_status) console.log(`   PIX Status: ${t.pix_status}`);
      if (t.pix_txid) console.log(`   PIX TxID: ${t.pix_txid}`);
    }

    // Verificar pagamento atualizado
    const pagAtualizado = await db.query('SELECT * FROM pagamentos WHERE id = $1', [pagamentoId]);
    const pag = pagAtualizado.rows[0];

    box('PAGAMENTO ATUALIZADO');
    console.log(`   ID: ${pag.id}`);
    console.log(`   Status: ${pag.status}`);
    console.log(`   Valor Total: R$ ${(pag.valor_total / 100).toFixed(2)}`);
    console.log(`   Taxa Plataforma: R$ ${(pag.valor_taxa / 100).toFixed(2)}`);
    console.log(`   Valor Empresa: R$ ${(pag.valor_empresa / 100).toFixed(2)}`);
    console.log(`   Status Repasse: ${pag.status_repasse}`);

    // Resumo final
    box('RESUMO FINAL');

    log('verde', `✅ Teste concluído com sucesso!\n`);
    console.log(`📊 Fluxo executado:`);
    console.log(`   1. Cliente "${clienteNome}" agendou vistoria`);
    console.log(`   2. Pagou R$ ${(VALOR_VISTORIA / 100).toFixed(2)} via PIX`);
    console.log(`   3. Sistema calculou split automaticamente:`);
    console.log(`      • Sua taxa: R$ ${(taxaPlataforma / 100).toFixed(2)}`);
    console.log(`      • Empresa: R$ ${(valorEmpresa / 100).toFixed(2)}`);
    console.log(`   4. Repasse Asaas: ${resultado.repasse_automatico?.sucesso ? '✅ Realizado' : '⏳ Pendente (sem saldo sandbox)'}`);

  } catch (error) {
    log('vermelho', `\n❌ Erro: ${error.message}`);
    console.error(error);
  } finally {
    // Limpar dados de teste
    box('LIMPANDO DADOS DE TESTE');

    try {
      if (pagamentoId) {
        await db.query('DELETE FROM transacoes WHERE pagamento_id = $1', [pagamentoId]);
        await db.query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
        log('verde', `✅ Pagamento e transações removidos`);
      }
      if (agendamentoId) {
        await db.query('DELETE FROM agendamentos WHERE id = $1', [agendamentoId]);
        log('verde', `✅ Agendamento removido`);
      }
      if (clienteId) {
        await db.query('DELETE FROM clientes WHERE id = $1', [clienteId]);
        log('verde', `✅ Cliente removido`);
      }

      log('verde', `\n🧹 Dados de teste limpos! Banco permanece intacto.`);
    } catch (e) {
      log('amarelo', `⚠️  Erro ao limpar: ${e.message}`);
    }

    console.log('\n');
    process.exit(0);
  }
}

main();
