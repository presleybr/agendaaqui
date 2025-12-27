/**
 * TESTE DO NOVO FLUXO COM TAXA PIX ASAAS
 *
 * Cenário: Empresa define vistoria por R$ 150,00
 * Cliente paga: R$ 151,99 (R$ 150 + R$ 1,99 taxa PIX)
 *
 * Split:
 * - Sua taxa: R$ 5,00
 * - Taxa PIX Asaas: R$ 1,99
 * - Empresa recebe: R$ 145,00
 */

process.env.DATABASE_URL = 'postgresql://agendamentos_user:Ir3BriZT5FvaolIk8vHty0NiXPcRXdxy@dpg-d4hoten5r7bs73c13o0g-a.oregon-postgres.render.com/agendamentos_2qh3?sslmode=require';
process.env.NODE_ENV = 'production';

require('dotenv').config();

const { Pool } = require('pg');
const { TAXA_PIX_ASAAS, calcularValorTotal, calcularSplit } = require('../src/config/taxas');

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

// Configuração do teste
const PRECO_VISTORIA = 15000; // R$ 150,00 (preço que a empresa define)
const TAXA_PLATAFORMA = 500;  // R$ 5,00 (sua taxa)
const EMPRESA_ID = 2;

async function main() {
  let clienteId, agendamentoId, pagamentoId;
  const transacaoIds = [];

  try {
    console.log('\n');
    log('magenta', '╔════════════════════════════════════════════════════════════╗');
    log('magenta', '║  TESTE: NOVO FLUXO COM TAXA PIX ASAAS                      ║');
    log('magenta', '╚════════════════════════════════════════════════════════════╝');

    // Conectar
    await pool.query('SELECT 1');
    log('verde', '✅ Conectado ao banco!\n');

    // Buscar empresa
    box('EMPRESA');
    const { rows: [empresa] } = await pool.query('SELECT * FROM empresas WHERE id = $1', [EMPRESA_ID]);
    console.log(`   Nome: ${empresa.nome}`);
    console.log(`   Preço vistoria: R$ ${(PRECO_VISTORIA / 100).toFixed(2)}`);
    console.log(`   Taxa plataforma: R$ ${(TAXA_PLATAFORMA / 100).toFixed(2)}`);
    console.log(`   Chave PIX: ${empresa.chave_pix}`);

    // Calcular valor que cliente paga
    box('CÁLCULO DO VALOR PARA O CLIENTE');

    const valorTotal = calcularValorTotal(PRECO_VISTORIA, true);

    console.log(`${c.cyan}┌────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.bold}O QUE O CLIENTE VAI PAGAR${c.reset}                              ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Valor da Vistoria:         R$ ${(PRECO_VISTORIA / 100).toFixed(2).padStart(8)}             ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  + Taxa PIX:                R$ ${(TAXA_PIX_ASAAS / 100).toFixed(2).padStart(8)}             ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.verde}${c.bold}TOTAL A PAGAR:             R$ ${(valorTotal / 100).toFixed(2).padStart(8)}${c.reset}             ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}└────────────────────────────────────────────────────────┘${c.reset}`);

    // Criar cliente e agendamento
    box('SIMULANDO AGENDAMENTO');

    const clienteNome = `Cliente Teste ${Date.now()}`;
    const { rows: [cliente] } = await pool.query(`
      INSERT INTO clientes (nome, email, telefone, empresa_id)
      VALUES ($1, $2, '11999999999', $3) RETURNING *
    `, [clienteNome, `teste${Date.now()}@test.com`, EMPRESA_ID]);
    clienteId = cliente.id;

    const protocolo = `TST${Date.now()}`;
    const dataHora = new Date();
    dataHora.setDate(dataHora.getDate() + 1);

    const { rows: [agendamento] } = await pool.query(`
      INSERT INTO agendamentos (empresa_id, cliente_id, data_hora, tipo_vistoria, valor, protocolo, status)
      VALUES ($1, $2, $3, 'cautelar', $4, $5, 'pendente') RETURNING *
    `, [EMPRESA_ID, clienteId, dataHora, valorTotal, protocolo]); // Salvamos o valor TOTAL
    agendamentoId = agendamento.id;

    log('verde', `✅ Agendamento #${agendamentoId} criado`);
    console.log(`   Valor salvo: R$ ${(valorTotal / 100).toFixed(2)} (inclui taxa PIX)`);

    // Simular pagamento
    box('SIMULANDO PAGAMENTO PIX');

    const { rows: [pagamento] } = await pool.query(`
      INSERT INTO pagamentos (agendamento_id, empresa_id, mp_payment_id, metodo_pagamento, valor_total, status, pago_em)
      VALUES ($1, $2, $3, 'pix', $4, 'approved', CURRENT_TIMESTAMP) RETURNING *
    `, [agendamentoId, EMPRESA_ID, `TESTE_${Date.now()}`, valorTotal]);
    pagamentoId = pagamento.id;

    log('verde', `✅ Pagamento #${pagamentoId} aprovado - R$ ${(valorTotal / 100).toFixed(2)}`);

    // Calcular split
    box('PROCESSANDO SPLIT');

    const valorEmpresa = valorTotal - TAXA_PLATAFORMA - TAXA_PIX_ASAAS;

    console.log(`${c.cyan}┌────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.bold}DIVISÃO DO PAGAMENTO${c.reset}                                  ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  Cliente pagou:           R$ ${(valorTotal / 100).toFixed(2).padStart(8)}                ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.amarelo}💰 SUA TAXA:${c.reset}              R$ ${(TAXA_PLATAFORMA / 100).toFixed(2).padStart(8)}  ${c.amarelo}← sua receita${c.reset}   ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.azul}💳 TAXA PIX ASAAS:${c.reset}        R$ ${(TAXA_PIX_ASAAS / 100).toFixed(2).padStart(8)}  ${c.azul}← custo PIX${c.reset}     ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  ${c.verde}💸 REPASSE EMPRESA:${c.reset}       R$ ${(valorEmpresa / 100).toFixed(2).padStart(8)}  ${c.verde}← empresa${c.reset}       ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}├────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.cyan}│${c.reset}  TOTAL: R$ ${(TAXA_PLATAFORMA / 100).toFixed(2)} + R$ ${(TAXA_PIX_ASAAS / 100).toFixed(2)} + R$ ${(valorEmpresa / 100).toFixed(2)} = R$ ${(valorTotal / 100).toFixed(2)} ✅  ${c.cyan}│${c.reset}`);
    console.log(`${c.cyan}└────────────────────────────────────────────────────────┘${c.reset}`);

    // Atualizar pagamento com split
    await pool.query(`
      UPDATE pagamentos SET
        valor_taxa = $1,
        taxa_pix = $2,
        valor_empresa = $3,
        status_repasse = 'pendente',
        split_data = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
      TAXA_PLATAFORMA,
      TAXA_PIX_ASAAS,
      valorEmpresa,
      JSON.stringify({
        taxa_plataforma: TAXA_PLATAFORMA,
        taxa_pix: TAXA_PIX_ASAAS,
        valor_empresa: valorEmpresa,
        processado_em: new Date().toISOString()
      }),
      pagamentoId
    ]);

    // Criar transações
    const { rows: [t1] } = await pool.query(`
      INSERT INTO transacoes (empresa_id, pagamento_id, tipo, valor, status, descricao)
      VALUES ($1, $2, 'comissao', $3, 'processado', 'Taxa plataforma') RETURNING id
    `, [EMPRESA_ID, pagamentoId, TAXA_PLATAFORMA]);
    transacaoIds.push(t1.id);

    const { rows: [t2] } = await pool.query(`
      INSERT INTO transacoes (empresa_id, pagamento_id, tipo, valor, status, descricao)
      VALUES ($1, $2, 'taxa_pix', $3, 'processado', 'Taxa PIX Asaas') RETURNING id
    `, [EMPRESA_ID, pagamentoId, TAXA_PIX_ASAAS]);
    transacaoIds.push(t2.id);

    const { rows: [t3] } = await pool.query(`
      INSERT INTO transacoes (empresa_id, pagamento_id, tipo, valor, status, descricao)
      VALUES ($1, $2, 'repasse', $3, 'pendente', 'Repasse empresa') RETURNING id
    `, [EMPRESA_ID, pagamentoId, valorEmpresa]);
    transacaoIds.push(t3.id);

    log('verde', '✅ Transações registradas!');

    // Mostrar transações
    box('TRANSAÇÕES NO BANCO');

    const { rows: transacoes } = await pool.query(`
      SELECT * FROM transacoes WHERE pagamento_id = $1 ORDER BY id
    `, [pagamentoId]);

    for (const t of transacoes) {
      let icon = '💰';
      let destino = 'SUA CONTA';
      if (t.tipo === 'taxa_pix') { icon = '💳'; destino = 'ASAAS (custo)'; }
      if (t.tipo === 'repasse') { icon = '💸'; destino = 'EMPRESA'; }

      console.log(`${icon} ${t.tipo.toUpperCase().padEnd(10)} → ${destino.padEnd(15)} R$ ${(t.valor / 100).toFixed(2).padStart(8)} [${t.status}]`);
    }

    // Verificar pagamento
    box('PAGAMENTO ATUALIZADO');

    const { rows: [pag] } = await pool.query('SELECT * FROM pagamentos WHERE id = $1', [pagamentoId]);

    console.log(`   ID: ${pag.id}`);
    console.log(`   Valor Total: R$ ${(pag.valor_total / 100).toFixed(2)}`);
    console.log(`   Sua Taxa: R$ ${(pag.valor_taxa / 100).toFixed(2)}`);
    console.log(`   Taxa PIX: R$ ${(pag.taxa_pix / 100).toFixed(2)}`);
    console.log(`   Valor Empresa: R$ ${(pag.valor_empresa / 100).toFixed(2)}`);
    console.log(`   Status Repasse: ${pag.status_repasse}`);

    // Resumo
    box('RESUMO FINAL');

    log('verde', '✅ Novo fluxo funcionando corretamente!\n');
    console.log('📊 Como fica a divisão:');
    console.log(`   • Cliente paga: R$ ${(valorTotal / 100).toFixed(2)}`);
    console.log(`   • Você recebe: R$ ${(TAXA_PLATAFORMA / 100).toFixed(2)} (sua taxa)`);
    console.log(`   • Asaas cobra: R$ ${(TAXA_PIX_ASAAS / 100).toFixed(2)} (custo PIX)`);
    console.log(`   • Empresa recebe: R$ ${(valorEmpresa / 100).toFixed(2)} (repasse)`);
    console.log(`\n${c.verde}A taxa do Asaas sai do cliente! ✅${c.reset}`);

  } catch (error) {
    log('vermelho', `\n❌ Erro: ${error.message}`);
    console.error(error);
  } finally {
    // Limpar
    box('LIMPANDO DADOS DE TESTE');
    try {
      for (const id of transacaoIds) {
        await pool.query('DELETE FROM transacoes WHERE id = $1', [id]);
      }
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
