/**
 * DEMONSTRAÇÃO DO CÁLCULO DE SPLIT
 * Simula o fluxo completo SEM precisar do banco de dados
 *
 * Cenário: Cliente paga R$ 150,00 por vistoria
 */

require('dotenv').config();

const { getInstance: getAsaasService } = require('../src/services/AsaasService');
const PixTransferService = require('../src/services/PixTransferService');

// Cores
const c = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  branco: '\x1b[37m',
  bold: '\x1b[1m'
};

function box(titulo, cor = 'cyan') {
  const linha = '═'.repeat(58);
  console.log(`\n${c[cor]}╔${linha}╗${c.reset}`);
  console.log(`${c[cor]}║${c.bold} ${titulo.padEnd(56)} ${c.reset}${c[cor]}║${c.reset}`);
  console.log(`${c[cor]}╚${linha}╝${c.reset}\n`);
}

function formatMoney(centavos) {
  return `R$ ${(centavos / 100).toFixed(2)}`;
}

// =================================================================
// CONFIGURAÇÃO DO CENÁRIO DE TESTE
// =================================================================

const CENARIO = {
  // Empresa cadastrada
  empresa: {
    id: 1,
    nome: 'Vistoria Veicular Express',
    chave_pix: '12345678901', // CPF para receber repasse
    percentual_plataforma: 500 // R$ 5,00 de taxa
  },

  // Preço definido pela empresa para vistoria
  precoVistoria: 15000, // R$ 150,00 em centavos

  // Cliente
  cliente: {
    nome: 'João da Silva',
    email: 'joao@email.com'
  }
};

async function demonstrarFluxo() {
  console.log('\n');
  box('DEMONSTRAÇÃO: FLUXO COMPLETO DE PAGAMENTO E REPASSE', 'magenta');

  // =====================================================
  // ETAPA 1: Empresa define preço
  // =====================================================
  box('ETAPA 1: EMPRESA DEFINE O PREÇO DA VISTORIA');

  console.log(`  ${c.azul}Empresa:${c.reset} ${CENARIO.empresa.nome}`);
  console.log(`  ${c.azul}Preço da vistoria:${c.reset} ${formatMoney(CENARIO.precoVistoria)}`);
  console.log(`  ${c.azul}Chave PIX (para repasse):${c.reset} ${CENARIO.empresa.chave_pix}`);
  console.log(`  ${c.azul}Taxa da plataforma:${c.reset} ${formatMoney(CENARIO.empresa.percentual_plataforma)}`);

  // =====================================================
  // ETAPA 2: Cliente paga
  // =====================================================
  box('ETAPA 2: CLIENTE PAGA VIA PIX');

  console.log(`  ${c.verde}Cliente:${c.reset} ${CENARIO.cliente.nome}`);
  console.log(`  ${c.verde}Valor pago:${c.reset} ${formatMoney(CENARIO.precoVistoria)}`);
  console.log(`  ${c.verde}Método:${c.reset} PIX (Mercado Pago)`);
  console.log(`  ${c.verde}Status:${c.reset} ✅ APROVADO`);

  // =====================================================
  // ETAPA 3: Sistema calcula split
  // =====================================================
  box('ETAPA 3: SISTEMA CALCULA O SPLIT');

  const valorTotal = CENARIO.precoVistoria;
  const taxaPlataforma = CENARIO.empresa.percentual_plataforma;
  const valorEmpresa = valorTotal - taxaPlataforma;

  console.log(`  ${c.cyan}┌─────────────────────────────────────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}│${c.reset} VALOR TOTAL PAGO:          ${c.bold}${formatMoney(valorTotal).padStart(20)}${c.reset} ${c.cyan}│${c.reset}`);
  console.log(`  ${c.cyan}├─────────────────────────────────────────────────────┤${c.reset}`);
  console.log(`  ${c.cyan}│${c.reset} ${c.amarelo}➤ Sua Taxa (Plataforma):${c.reset}   ${formatMoney(taxaPlataforma).padStart(20)} ${c.cyan}│${c.reset}`);
  console.log(`  ${c.cyan}│${c.reset}   (${((taxaPlataforma / valorTotal) * 100).toFixed(2)}% do valor total)                        ${c.cyan}│${c.reset}`);
  console.log(`  ${c.cyan}├─────────────────────────────────────────────────────┤${c.reset}`);
  console.log(`  ${c.cyan}│${c.reset} ${c.verde}➤ Repasse Empresa:${c.reset}         ${formatMoney(valorEmpresa).padStart(20)} ${c.cyan}│${c.reset}`);
  console.log(`  ${c.cyan}│${c.reset}   (${((valorEmpresa / valorTotal) * 100).toFixed(2)}% do valor total)                        ${c.cyan}│${c.reset}`);
  console.log(`  ${c.cyan}└─────────────────────────────────────────────────────┘${c.reset}`);

  // =====================================================
  // ETAPA 4: Sistema tenta repasse via Asaas
  // =====================================================
  box('ETAPA 4: REPASSE AUTOMÁTICO VIA ASAAS PIX');

  const asaas = getAsaasService();
  const pixService = new PixTransferService();

  console.log(`  ${c.azul}Serviço Asaas:${c.reset} ${asaas.isReady() ? '✅ Configurado' : '⚠️  Não configurado'}`);
  console.log(`  ${c.azul}Ambiente:${c.reset} ${asaas.sandbox ? '🧪 Sandbox (teste)' : '🚀 Produção'}`);

  if (asaas.isReady()) {
    try {
      const { saldo, saldo_formatado } = await asaas.getSaldo();
      console.log(`  ${c.azul}Saldo disponível:${c.reset} ${saldo_formatado}`);

      if (saldo >= valorEmpresa / 100) {
        console.log(`\n  ${c.verde}✅ Saldo suficiente para repasse!${c.reset}`);

        // Simular tentativa de transferência
        console.log(`\n  ${c.amarelo}📤 Tentando transferência PIX...${c.reset}`);
        console.log(`     Destino: ${CENARIO.empresa.chave_pix}`);
        console.log(`     Valor: ${formatMoney(valorEmpresa)}`);

        // Aqui faria a transferência real
        // const resultado = await pixService.transferirPix({...})

        console.log(`\n  ${c.amarelo}⚠️  Transferência não executada (modo demonstração)${c.reset}`);
        console.log(`     Para executar de verdade, use: --executar`);

      } else {
        console.log(`\n  ${c.amarelo}⚠️  Saldo insuficiente para repasse${c.reset}`);
        console.log(`     Necessário: ${formatMoney(valorEmpresa)}`);
        console.log(`     Disponível: ${saldo_formatado}`);
        console.log(`\n  ${c.cyan}💡 No sandbox do Asaas, simule um depósito para ter saldo.${c.reset}`);
      }

    } catch (error) {
      console.log(`\n  ${c.vermelho}❌ Erro ao consultar Asaas: ${error.message}${c.reset}`);
    }
  } else {
    console.log(`\n  ${c.amarelo}💡 Asaas não configurado - transferência seria simulada${c.reset}`);
  }

  // =====================================================
  // RESUMO FINAL
  // =====================================================
  box('RESUMO: COMO FICA A DIVISÃO DO DINHEIRO', 'verde');

  console.log(`  ${c.branco}Cliente pagou:${c.reset} ${formatMoney(valorTotal)}`);
  console.log('');
  console.log(`  ${c.amarelo}💰 SUA CONTA (Plataforma):${c.reset}`);
  console.log(`     + ${formatMoney(taxaPlataforma)} (taxa de serviço)`);
  console.log('');
  console.log(`  ${c.verde}💸 CONTA DA EMPRESA:${c.reset}`);
  console.log(`     + ${formatMoney(valorEmpresa)} (via PIX Asaas)`);
  console.log('');
  console.log(`  ${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`  ${c.branco}Total: ${formatMoney(taxaPlataforma)} + ${formatMoney(valorEmpresa)} = ${formatMoney(valorTotal)}${c.reset} ✅`);

  // =====================================================
  // OUTROS CENÁRIOS
  // =====================================================
  box('OUTROS CENÁRIOS DE PREÇO', 'azul');

  const cenarios = [
    { nome: 'Vistoria Cautelar', valor: 35000, taxa: 500 },
    { nome: 'Vistoria Transferência', valor: 22000, taxa: 500 },
    { nome: 'Preço personalizado', valor: 15000, taxa: 500 },
    { nome: 'Preço premium', valor: 50000, taxa: 1000 }
  ];

  console.log(`  ${'Tipo'.padEnd(25)} ${'Valor'.padStart(12)} ${'Sua Taxa'.padStart(12)} ${'Empresa'.padStart(12)}`);
  console.log(`  ${'─'.repeat(25)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(12)}`);

  for (const cen of cenarios) {
    const repasse = cen.valor - cen.taxa;
    console.log(`  ${cen.nome.padEnd(25)} ${formatMoney(cen.valor).padStart(12)} ${formatMoney(cen.taxa).padStart(12)} ${formatMoney(repasse).padStart(12)}`);
  }

  console.log('\n');
}

// Verificar se quer executar transferência real
if (process.argv.includes('--executar')) {
  console.log(`\n${c.vermelho}⚠️  MODO EXECUÇÃO REAL${c.reset}`);
  console.log('Este modo executaria uma transferência PIX real no sandbox.');
  console.log('Por segurança, esta funcionalidade está desabilitada neste script de demo.');
  console.log('Use o script simular-pagamento-completo.js com banco de dados configurado.\n');
  process.exit(0);
}

demonstrarFluxo().catch(console.error);
