/**
 * TESTE DIRETO DO SPLIT - Usa estrutura real do banco
 */

process.env.DATABASE_URL = 'postgresql://agendamentos_user:Ir3BriZT5FvaolIk8vHty0NiXPcRXdxy@dpg-d4hoten5r7bs73c13o0g-a.oregon-postgres.render.com/agendamentos_2qh3?sslmode=require';
process.env.NODE_ENV = 'production';

require('dotenv').config();

const { Pool } = require('pg');
const { getInstance: getAsaasService } = require('../src/services/AsaasService');
const PixTransferService = require('../src/services/PixTransferService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

// CONFIGURAÇÃO
const VALOR_VISTORIA = 15000; // R$ 150,00
const TAXA_PLATAFORMA = 500;  // R$ 5,00
const EMPRESA_ID = 2;

async function main() {
  let clienteId, agendamentoId, pagamentoId, transacaoTaxaId, transacaoRepasseId;

  try {
    console.log('\n');
    log('magenta', '╔════════════════════════════════════════════════════════════╗');
    log('magenta', '║  TESTE SPLIT + REPASSE ASAAS (DIRETO NO BANCO)            ║');
    log('magenta', '╚════════════════════════════════════════════════════════════╝');

    // Conectar
    log('azul', '\n📡 Conectando ao PostgreSQL no Render...');
    await pool.query('SELECT 1');
    log('verde', '✅ Conectado!\n');

    // Buscar empresa
    box('PASSO 1: EMPRESA');
    const { rows: [empresa] } = await pool.query('SELECT * FROM empresas WHERE id = $1', [EMPRESA_ID]);

    log('verde', `✅ Empresa: ${empresa.nome}`);
    console.log(`   Chave PIX: ${empresa.chave_pix}`);
    console.log(`   Taxa: R$ ${(TAXA_PLATAFORMA / 100).toFixed(2)}`);

    // Criar cliente
    box('PASSO 2: CLIENTE AGENDA');
    const clienteNome = `Teste Split ${Date.now()}`;

    const { rows: [cliente] } = await pool.query(`
      INSERT INTO clientes (nome, email, telefone, empresa_id)
      VALUES ($1, $2, '11999999999', $3) RETURNING *
    `, [clienteNome, `teste${Date.now()}@test.com`, EMPRESA_ID]);
    clienteId = cliente.id;

    // Criar agendamento
    const protocolo = `TST${Date.now()}`;
    const dataHora = new Date();
    dataHora.setDate(dataHora.getDate() + 1);

    const { rows: [agendamento] } = await pool.query(`
      INSERT INTO agendamentos (empresa_id, cliente_id, data_hora, tipo_vistoria, valor, protocolo, status)
      VALUES ($1, $2, $3, 'cautelar', $4, $5, 'pendente') RETURNING *
    `, [EMPRESA_ID, clienteId, dataHora, VALOR_VISTORIA, protocolo]);
    agendamentoId = agendamento.id;

    log('verde', `✅ Cliente: ${clienteNome}`);
    log('verde', `✅ Agendamento: #${agendamentoId} - R$ ${(VALOR_VISTORIA / 100).toFixed(2)}`);

    // Criar pagamento aprovado
    box('PASSO 3: PAGAMENTO PIX APROVADO');

    const { rows: [pagamento] } = await pool.query(`
      INSERT INTO pagamentos (agendamento_id, empresa_id, mp_payment_id, metodo_pagamento, valor_total, status, pago_em)
      VALUES ($1, $2, $3, 'pix', $4, 'approved', CURRENT_TIMESTAMP) RETURNING *
    `, [agendamentoId, EMPRESA_ID, `TESTE_${Date.now()}`, VALOR_VISTORIA]);
    pagamentoId = pagamento.id;

    log('verde', `✅ Pagamento #${pagamentoId} - Status: approved`);
    console.log(`   Valor: R$ ${(VALOR_VISTORIA / 100).toFixed(2)}`);

    // Calcular split
    box('PASSO 4: CALCULANDO SPLIT');

    const valorEmpresa = VALOR_VISTORIA - TAXA_PLATAFORMA;

    console.log(`${c.cyan}┌────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.bold}DIVISÃO DO PAGAMENTO${c.reset}                                  ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Valor Pago:           R$ ${(VALOR_VISTORIA / 100).toFixed(2).padStart(8)}                  ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.amarelo}💰 SUA TAXA:${c.reset}           R$ ${(TAXA_PLATAFORMA / 100).toFixed(2).padStart(8)}  ${c.amarelo}← fica com você${c.reset}   ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.verde}💸 REPASSE EMPRESA:${c.reset}    R$ ${(valorEmpresa / 100).toFixed(2).padStart(8)}  ${c.verde}← via PIX Asaas${c.reset}   ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}└────────────────────────────────────────────────────────┘${c.reset}`);

    // Atualizar pagamento com split
    await pool.query(`
      UPDATE pagamentos SET
        valor_taxa = $1,
        valor_empresa = $2,
        status_repasse = 'pendente',
        split_data = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [
      TAXA_PLATAFORMA,
      valorEmpresa,
      JSON.stringify({
        processado_em: new Date().toISOString(),
        taxa_percentual: ((TAXA_PLATAFORMA / VALOR_VISTORIA) * 100).toFixed(2),
        empresa_nome: empresa.nome,
        empresa_pix: empresa.chave_pix
      }),
      pagamentoId
    ]);

    // Criar transação de comissão (taxa plataforma)
    const { rows: [tTaxa] } = await pool.query(`
      INSERT INTO transacoes (empresa_id, pagamento_id, tipo, valor, status)
      VALUES ($1, $2, 'comissao', $3, 'processado') RETURNING *
    `, [EMPRESA_ID, pagamentoId, TAXA_PLATAFORMA]);
    transacaoTaxaId = tTaxa.id;

    log('verde', `✅ Transação COMISSÃO #${transacaoTaxaId} - R$ ${(TAXA_PLATAFORMA / 100).toFixed(2)}`);

    // Criar transação de repasse
    const { rows: [tRepasse] } = await pool.query(`
      INSERT INTO transacoes (empresa_id, pagamento_id, tipo, valor, status)
      VALUES ($1, $2, 'repasse', $3, 'pendente') RETURNING *
    `, [EMPRESA_ID, pagamentoId, valorEmpresa]);
    transacaoRepasseId = tRepasse.id;

    log('verde', `✅ Transação REPASSE #${transacaoRepasseId} - R$ ${(valorEmpresa / 100).toFixed(2)}`);

    // Tentar repasse via Asaas
    box('PASSO 5: REPASSE PIX VIA ASAAS');

    const asaas = getAsaasService();
    const pixService = new PixTransferService();

    console.log(`   Asaas configurado: ${asaas.isReady() ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Ambiente: ${asaas.sandbox ? '🧪 Sandbox' : '🚀 Produção'}`);

    if (asaas.isReady()) {
      try {
        const { saldo, saldo_formatado } = await asaas.getSaldo();
        console.log(`   Saldo disponível: ${saldo_formatado}`);

        if (saldo >= valorEmpresa / 100) {
          log('amarelo', '\n📤 Executando transferência PIX...');

          const resultado = await pixService.transferirPix({
            chave_pix: empresa.chave_pix,
            valor: valorEmpresa,
            empresa_nome: empresa.nome,
            empresa_id: EMPRESA_ID,
            split_id: transacaoRepasseId
          });

          if (resultado.sucesso) {
            log('verde', '\n🎉 REPASSE REALIZADO COM SUCESSO!');
            console.log(`   Comprovante: ${resultado.comprovante}`);
            console.log(`   Status: ${resultado.status}`);
            console.log(`   Tipo: ${resultado.tipo}`);

            // Atualizar transação
            await pool.query(`
              UPDATE transacoes SET status = 'processado', comprovante = $1, processado_em = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [resultado.comprovante, transacaoRepasseId]);

            // Atualizar pagamento
            await pool.query(`
              UPDATE pagamentos SET status_repasse = 'processado', data_repasse = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [pagamentoId]);

          } else {
            log('amarelo', `\n⚠️  Repasse não realizado: ${resultado.mensagem}`);
          }

        } else {
          log('amarelo', `\n⚠️  Saldo insuficiente para repasse`);
          console.log(`   Necessário: R$ ${(valorEmpresa / 100).toFixed(2)}`);
          console.log(`   Disponível: ${saldo_formatado}`);
          log('cyan', '\n💡 Adicione saldo no sandbox: https://sandbox.asaas.com');
        }

      } catch (e) {
        log('vermelho', `\n❌ Erro Asaas: ${e.message}`);
      }
    }

    // Mostrar resultado final
    box('RESULTADO FINAL');

    const { rows: transacoes } = await pool.query(`
      SELECT * FROM transacoes WHERE pagamento_id = $1 ORDER BY tipo
    `, [pagamentoId]);

    for (const t of transacoes) {
      const icon = t.tipo === 'comissao' ? '💰' : '💸';
      const destino = t.tipo === 'comissao' ? 'SUA CONTA' : 'EMPRESA';
      console.log(`${icon} ${t.tipo.toUpperCase()} → ${destino}: R$ ${(t.valor / 100).toFixed(2)} [${t.status}]`);
    }

    const { rows: [pagFinal] } = await pool.query('SELECT * FROM pagamentos WHERE id = $1', [pagamentoId]);

    console.log(`\n📋 Pagamento #${pagFinal.id}:`);
    console.log(`   Status: ${pagFinal.status}`);
    console.log(`   Valor Total: R$ ${(pagFinal.valor_total / 100).toFixed(2)}`);
    console.log(`   Sua Taxa: R$ ${(pagFinal.valor_taxa / 100).toFixed(2)}`);
    console.log(`   Valor Empresa: R$ ${(pagFinal.valor_empresa / 100).toFixed(2)}`);
    console.log(`   Status Repasse: ${pagFinal.status_repasse}`);

    log('verde', '\n✅ Teste concluído com sucesso!');

  } catch (error) {
    log('vermelho', `\n❌ Erro: ${error.message}`);
    console.error(error);
  } finally {
    // Limpar
    box('LIMPANDO DADOS DE TESTE');
    try {
      if (transacaoTaxaId) await pool.query('DELETE FROM transacoes WHERE id = $1', [transacaoTaxaId]);
      if (transacaoRepasseId) await pool.query('DELETE FROM transacoes WHERE id = $1', [transacaoRepasseId]);
      if (pagamentoId) await pool.query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
      if (agendamentoId) await pool.query('DELETE FROM agendamentos WHERE id = $1', [agendamentoId]);
      if (clienteId) await pool.query('DELETE FROM clientes WHERE id = $1', [clienteId]);
      log('verde', '✅ Dados de teste removidos');
    } catch (e) {
      log('amarelo', `⚠️  Erro limpeza: ${e.message}`);
    }

    await pool.end();
    console.log('\n');
    process.exit(0);
  }
}

main();
