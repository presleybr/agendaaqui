#!/usr/bin/env node

/**
 * Script para aprovar pagamento diretamente
 * Simula o que aconteceria quando o webhook do Mercado Pago recebe aprovação
 */

const API_URL = 'https://agendaaqui-backend.onrender.com/api';

async function approveLastPayment() {
  console.log('💳 APROVAÇÃO DIRETA DE PAGAMENTO\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Criar um novo agendamento e pagamento
    console.log('PASSO 1: Criando agendamento completo...\n');

    // Buscar data e horário
    const datesResponse = await fetch(`${API_URL}/availability/dates?days=7`);
    const dates = await datesResponse.json();
    const primeiraData = dates[0].data;

    const slotsResponse = await fetch(`${API_URL}/availability/slots?data=${primeiraData}`);
    const slots = await slotsResponse.json();
    const slotDisponivel = slots.find(s => s.disponivel);

    const pricesResponse = await fetch(`${API_URL}/availability/prices`);
    const prices = await pricesResponse.json();

    // Criar agendamento
    const agendamentoData = {
      cliente: {
        nome: 'Cliente Teste Aprovação',
        cpf: '111.222.333-44',
        telefone: '(67) 99999-1111',
        email: 'aprovacao@teste.com'
      },
      veiculo: {
        placa: 'APR-2024',
        marca: 'Teste',
        modelo: 'Aprovação',
        ano: 2024
      },
      tipo_vistoria: 'cautelar',
      data: primeiraData,
      horario: slotDisponivel.horario,
      endereco_vistoria: 'Rua Aprovação, 789'
    };

    console.log('📋 Criando agendamento...');
    const agendamentoResponse = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agendamentoData)
    });

    if (!agendamentoResponse.ok) {
      const error = await agendamentoResponse.json();
      console.log('❌ Erro ao criar agendamento:', error);
      return;
    }

    const agendamento = await agendamentoResponse.json();
    console.log(`✅ Agendamento ID: ${agendamento.id}`);
    console.log(`✅ Protocolo: ${agendamento.protocolo}`);
    console.log(`📅 Data: ${primeiraData} às ${slotDisponivel.horario}`);
    console.log(`💰 Valor: R$ ${(prices.cautelar.valor / 100).toFixed(2)}\n`);

    // Criar PIX
    console.log('💳 Gerando PIX...');
    const pixData = {
      transaction_amount: prices.cautelar.valor / 100,
      description: `Vistoria - ${agendamento.protocolo}`,
      payer_email: agendamentoData.cliente.email,
      payer_first_name: agendamentoData.cliente.nome.split(' ')[0],
      payer_last_name: agendamentoData.cliente.nome.split(' ').slice(1).join(' '),
      payer_identification_type: 'CPF',
      payer_identification_number: '12345678909',  // CPF de teste do Mercado Pago
      agendamento_id: agendamento.id
    };

    const pixResponse = await fetch(`${API_URL}/payment/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pixData)
    });

    if (!pixResponse.ok) {
      const error = await pixResponse.json();
      console.log('❌ Erro ao gerar PIX:', error);
      return;
    }

    const pixPayment = await pixResponse.json();
    console.log('✅ PIX gerado com sucesso!');
    console.log(`   Payment ID: ${pixPayment.payment_id}`);
    console.log(`   Status: ${pixPayment.status}`);
    console.log(`   QR Code: ${pixPayment.qr_code ? 'Gerado ✅' : 'Erro ❌'}\n`);

    if (!pixPayment.payment_id) {
      console.log('❌ Payment ID não retornado. Verifique os logs do backend.\n');
      console.log('📋 Resposta completa do PIX:');
      console.log(JSON.stringify(pixPayment, null, 2));
      return;
    }

    // 2. Simular aprovação via webhook
    console.log('\nPASSO 2: Simulando webhook de aprovação...\n');

    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: pixPayment.payment_id },
      date_created: new Date().toISOString(),
      type: 'payment'
    };

    console.log('🔔 Enviando webhook...');
    const webhookResponse = await fetch(`${API_URL}/payment/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    const webhookResult = await webhookResponse.json();
    console.log(`✅ Webhook processado: ${webhookResponse.status}`);
    console.log(`   Resposta:`, webhookResult);

    // Aguardar processamento
    console.log('\n⏳ Aguardando processamento (5 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Verificar resultado pelo protocolo (não precisa auth)
    console.log('\nPASSO 3: Verificando resultado...\n');

    const agendamentoCheckResponse = await fetch(`${API_URL}/agendamentos/protocolo/${agendamento.protocolo}`);

    if (agendamentoCheckResponse.ok) {
      const agendamentoAtual = await agendamentoCheckResponse.json();

      console.log('═══════════════════════════════════════════════════');
      console.log('📊 RESULTADO FINAL');
      console.log('═══════════════════════════════════════════════════\n');

      console.log('📋 Agendamento:');
      console.log(`   Protocolo: ${agendamentoAtual.protocolo}`);
      console.log(`   Status: ${agendamentoAtual.status}`);
      console.log(`   Pagamento Confirmado: ${agendamentoAtual.pagamento_confirmado ? '✅ SIM' : '⏳ Não'}\n`);

      console.log('👤 Cliente:');
      console.log(`   Nome: ${agendamentoAtual.cliente_nome || agendamentoData.cliente.nome}`);
      console.log(`   Email: ${agendamentoAtual.cliente_email || agendamentoData.cliente.email}`);
      console.log(`   Telefone: ${agendamentoAtual.cliente_telefone || agendamentoData.cliente.telefone}\n`);

      console.log('🚗 Veículo:');
      console.log(`   Placa: ${agendamentoAtual.veiculo_placa || agendamentoData.veiculo.placa}`);
      console.log(`   Modelo: ${agendamentoAtual.veiculo_modelo || agendamentoData.veiculo.modelo}\n`);

      console.log('💰 Pagamento:');
      console.log(`   Valor: R$ ${((agendamentoAtual.preco || prices.cautelar.valor) / 100).toFixed(2)}`);
      console.log(`   Payment ID: ${pixPayment.payment_id}\n`);

      if (agendamentoAtual.status === 'confirmado' && agendamentoAtual.pagamento_confirmado) {
        console.log('🎉 SUCESSO! Pagamento aprovado e agendamento confirmado!\n');
      } else if (agendamentoAtual.status === 'pendente') {
        console.log('⚠️  STATUS PENDENTE\n');
        console.log('Possíveis razões:');
        console.log('1. Webhook ainda processando (aguarde mais alguns segundos)');
        console.log('2. MP_ACCESS_TOKEN não configurado no Render');
        console.log('3. Payment ID inválido ou pagamento não encontrado no MP\n');
      }

    } else {
      console.log('❌ Erro ao buscar agendamento atualizado');
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
  }
}

// Executar
approveLastPayment();
