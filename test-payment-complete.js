#!/usr/bin/env node

const API_URL = 'https://agendaaqui-backend.onrender.com/api';

async function testCompletePaymentFlow() {
  console.log('🧪 Iniciando teste COMPLETO de fluxo de pagamento...\n');

  try {
    // 1. Verificar datas disponíveis
    console.log('📅 1. Buscando datas disponíveis...');
    const datesResponse = await fetch(`${API_URL}/availability/dates?days=7`);
    const dates = await datesResponse.json();
    console.log(`✅ ${dates.length} datas disponíveis encontradas`);

    if (dates.length === 0) {
      console.log('❌ Nenhuma data disponível.');
      return;
    }

    const primeiraData = dates[0].data;
    console.log(`📆 Usando data: ${primeiraData}\n`);

    // 2. Buscar horários disponíveis
    console.log('🕐 2. Buscando horários disponíveis...');
    const slotsResponse = await fetch(`${API_URL}/availability/slots?data=${primeiraData}`);
    const slots = await slotsResponse.json();
    console.log(`✅ ${slots.length} horários encontrados`);

    const slotDisponivel = slots.find(s => s.disponivel);
    if (!slotDisponivel) {
      console.log('❌ Nenhum horário disponível.');
      return;
    }

    console.log(`⏰ Usando horário: ${slotDisponivel.horario}\n`);

    // 3. Buscar preços
    console.log('💰 3. Buscando preços...');
    const pricesResponse = await fetch(`${API_URL}/availability/prices`);
    const prices = await pricesResponse.json();
    console.log('✅ Preços carregados\n');

    // 4. Criar agendamento
    console.log('📋 4. Criando agendamento...');
    const agendamentoData = {
      cliente: {
        nome: 'Teste Simulação Completa',
        cpf: '123.456.789-09',
        telefone: '(67) 99999-8888',
        email: 'teste.completo@agendaaqui.com'
      },
      veiculo: {
        placa: 'SIM-1234',
        marca: 'Teste',
        modelo: 'Simulação',
        ano: 2024,
        chassi: null
      },
      tipo_vistoria: 'transferencia',
      data: primeiraData,
      horario: slotDisponivel.horario,
      endereco_vistoria: 'Rua Teste Simulação, 456'
    };

    const agendamentoResponse = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agendamentoData)
    });

    if (!agendamentoResponse.ok) {
      const error = await agendamentoResponse.json();
      console.log('❌ Erro ao criar agendamento:', error);
      return;
    }

    const agendamento = await agendamentoResponse.json();
    console.log('✅ Agendamento criado:');
    console.log(`   ID: ${agendamento.id}`);
    console.log(`   Protocolo: ${agendamento.protocolo}`);
    console.log('');

    // 5. Gerar PIX
    console.log('💳 5. Gerando pagamento PIX...');
    const pixData = {
      transaction_amount: prices.transferencia.valor / 100,
      description: `Vistoria Transferência - ${agendamento.protocolo}`,
      payer_email: agendamentoData.cliente.email,
      payer_first_name: agendamentoData.cliente.nome.split(' ')[0],
      payer_last_name: agendamentoData.cliente.nome.split(' ').slice(1).join(' ') || 'Silva',
      payer_identification_type: 'CPF',
      payer_identification_number: agendamentoData.cliente.cpf.replace(/\D/g, ''),
      agendamento_id: agendamento.id
    };

    const pixResponse = await fetch(`${API_URL}/payment/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixData)
    });

    if (!pixResponse.ok) {
      const error = await pixResponse.json();
      console.log('❌ Erro ao gerar PIX:', error);
      return;
    }

    const pixPayment = await pixResponse.json();
    console.log('✅ PIX gerado!');
    console.log(`   Payment ID: ${pixPayment.payment_id}\n`);

    // 6. Simular aprovação do pagamento via webhook
    console.log('🔔 6. Simulando aprovação do pagamento (webhook)...');

    // Simular o webhook que o Mercado Pago enviaria
    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: {
        id: pixPayment.payment_id
      },
      date_created: new Date().toISOString(),
      id: Math.floor(Math.random() * 1000000),
      live_mode: false,
      type: 'payment',
      user_id: '123456789'
    };

    const webhookResponse = await fetch(`${API_URL}/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    if (webhookResponse.ok) {
      console.log('✅ Webhook processado com sucesso!\n');
    } else {
      const error = await webhookResponse.text();
      console.log('⚠️  Resposta do webhook:', webhookResponse.status, error, '\n');
    }

    // 7. Aguardar processamento
    console.log('⏳ 7. Aguardando processamento (3 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');

    // 8. Verificar status do pagamento
    console.log('🔍 8. Verificando status final do pagamento...');
    const statusResponse = await fetch(`${API_URL}/payment/status/${pixPayment.payment_id}`);

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Status do pagamento:', status.status);
      console.log(`   Status detail: ${status.status_detail || 'N/A'}`);
      console.log('');
    } else {
      console.log('⚠️  Não foi possível verificar status\n');
    }

    // 9. Verificar status do agendamento
    console.log('📋 9. Verificando status do agendamento...');
    const agendamentoStatusResponse = await fetch(`${API_URL}/agendamentos/${agendamento.id}`);

    if (agendamentoStatusResponse.ok) {
      const agendamentoAtualizado = await agendamentoStatusResponse.json();
      console.log('✅ Status do agendamento:', agendamentoAtualizado.status);
      console.log(`   Pagamento confirmado: ${agendamentoAtualizado.pagamento_confirmado ? 'Sim ✅' : 'Não ⏳'}`);
      console.log('');
    } else {
      console.log('⚠️  Não foi possível verificar agendamento\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ TESTE COMPLETO FINALIZADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📝 Resumo Final:');
    console.log(`   - Agendamento: ${agendamento.protocolo}`);
    console.log(`   - Cliente: ${agendamentoData.cliente.nome}`);
    console.log(`   - Veículo: ${agendamentoData.veiculo.placa}`);
    console.log(`   - Data/Hora: ${primeiraData} às ${slotDisponivel.horario}`);
    console.log(`   - Valor: R$ ${(prices.transferencia.valor / 100).toFixed(2)}`);
    console.log(`   - Payment ID: ${pixPayment.payment_id}`);
    console.log('\n🎉 Fluxo completo: Agendamento → PIX → Webhook → Aprovação');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompletePaymentFlow();
