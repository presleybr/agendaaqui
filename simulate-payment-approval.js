#!/usr/bin/env node

/**
 * Script para simular aprovação de pagamento PIX
 *
 * Para funcionar, você precisa:
 * 1. Ter o MP_ACCESS_TOKEN configurado no Render
 * 2. Estar usando credenciais de TESTE do Mercado Pago
 * 3. Ter criado um pagamento PIX anteriormente
 */

const API_URL = 'https://agendaaqui-backend.onrender.com/api';

async function simulatePaymentApproval() {
  console.log('🧪 SIMULAÇÃO DE APROVAÇÃO DE PAGAMENTO PIX\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Passo 1: Criar agendamento e pagamento
    console.log('📅 ETAPA 1: Criando agendamento...');

    const datesResponse = await fetch(`${API_URL}/availability/dates?days=7`);
    const dates = await datesResponse.json();
    const primeiraData = dates[0].data;

    const slotsResponse = await fetch(`${API_URL}/availability/slots?data=${primeiraData}`);
    const slots = await slotsResponse.json();
    const slotDisponivel = slots.find(s => s.disponivel);

    const pricesResponse = await fetch(`${API_URL}/availability/prices`);
    const prices = await pricesResponse.json();

    const agendamentoData = {
      cliente: {
        nome: 'APRO',  // Nome especial para aprovação automática em teste
        cpf: '123.456.789-09',
        telefone: '(11) 98888-7777',
        email: 'test_user_123456@testuser.com'  // Email de teste do MP
      },
      veiculo: {
        placa: 'APRO-001',
        marca: 'Test',
        modelo: 'Aprovado',
        ano: 2024
      },
      tipo_vistoria: 'cautelar',
      data: primeiraData,
      horario: slotDisponivel.horario,
      endereco_vistoria: 'Rua Teste, 123'
    };

    const agendamentoResponse = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agendamentoData)
    });

    const agendamento = await agendamentoResponse.json();
    console.log(`   ✅ Agendamento criado: ${agendamento.protocolo}`);
    console.log(`   📋 ID: ${agendamento.id}\n`);

    // Passo 2: Criar pagamento PIX
    console.log('💳 ETAPA 2: Gerando PIX...');

    const pixData = {
      transaction_amount: prices.cautelar.valor / 100,
      description: `Vistoria - ${agendamento.protocolo}`,
      payer_email: agendamentoData.cliente.email,
      payer_first_name: 'APRO',
      payer_last_name: 'Test',
      payer_identification_type: 'CPF',
      payer_identification_number: '12345678909',
      agendamento_id: agendamento.id
    };

    const pixResponse = await fetch(`${API_URL}/payment/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pixData)
    });

    const pixPayment = await pixResponse.json();
    console.log(`   ✅ PIX criado: ${pixPayment.payment_id}`);
    console.log(`   💰 Valor: R$ ${(prices.cautelar.valor / 100).toFixed(2)}`);
    console.log(`   📊 Status inicial: ${pixPayment.status}\n`);

    // Passo 3: Disparar webhook manualmente (simula notificação do MP)
    console.log('🔔 ETAPA 3: Disparando webhook de aprovação...');

    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: pixPayment.payment_id },
      date_created: new Date().toISOString(),
      id: Math.floor(Math.random() * 1000000),
      live_mode: false,
      type: 'payment',
      user_id: '123456789'
    };

    const webhookResponse = await fetch(`${API_URL}/payment/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (webhookResponse.ok) {
      console.log('   ✅ Webhook enviado com sucesso');
      console.log('   ⏳ Aguardando processamento...\n');
    } else {
      console.log('   ⚠️  Webhook retornou:', webhookResponse.status);
      const errorText = await webhookResponse.text();
      console.log('   📝', errorText, '\n');
    }

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Passo 4: Verificar status do pagamento
    console.log('🔍 ETAPA 4: Verificando status...');

    const statusResponse = await fetch(`${API_URL}/payment/status/${pixPayment.payment_id}`);

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log(`   💳 Status Pagamento: ${status.status}`);

      if (status.status === 'approved') {
        console.log('   ✅ PAGAMENTO APROVADO!\n');
      } else if (status.status === 'pending') {
        console.log('   ⏳ Ainda pendente (esperado em ambiente de teste)\n');
      } else {
        console.log(`   ⚠️  Status: ${status.status}\n`);
      }
    }

    // Passo 5: Verificar agendamento
    console.log('📋 ETAPA 5: Verificando agendamento...');

    const agendamentoCheckResponse = await fetch(`${API_URL}/agendamentos/${agendamento.id}`);

    if (agendamentoCheckResponse.ok) {
      const agendamentoAtual = await agendamentoCheckResponse.json();
      console.log(`   📊 Status: ${agendamentoAtual.status}`);
      console.log(`   💰 Pagamento confirmado: ${agendamentoAtual.pagamento_confirmado ? 'SIM ✅' : 'NÃO ⏳'}\n`);
    }

    // Resultado final
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESULTADO DA SIMULAÇÃO');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('📝 Dados da compra:');
    console.log(`   • Protocolo: ${agendamento.protocolo}`);
    console.log(`   • Cliente: ${agendamentoData.cliente.nome}`);
    console.log(`   • Veículo: ${agendamentoData.veiculo.placa}`);
    console.log(`   • Data: ${primeiraData} às ${slotDisponivel.horario}`);
    console.log(`   • Valor: R$ ${(prices.cautelar.valor / 100).toFixed(2)}`);
    console.log(`   • Payment ID: ${pixPayment.payment_id}\n`);

    console.log('💡 NOTA IMPORTANTE:');
    console.log('   Em ambiente de TESTE do Mercado Pago, os pagamentos');
    console.log('   permanecem como "pending" mesmo após o webhook.');
    console.log('   Isso é esperado e normal!\n');
    console.log('   Para testar aprovação real, você precisa:');
    console.log('   1. Usar o app sandbox do Mercado Pago');
    console.log('   2. Ou usar a API de testes do MP para aprovar manualmente\n');

    console.log('✅ Simulação concluída com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
  }
}

// Executar
simulatePaymentApproval();
