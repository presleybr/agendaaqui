#!/usr/bin/env node

const API_URL = 'https://agendaaqui-backend.onrender.com/api';

async function testPaymentFlow() {
  console.log('🧪 Iniciando teste de fluxo de pagamento...\n');

  try {
    // 1. Verificar datas disponíveis
    console.log('📅 1. Buscando datas disponíveis...');
    const datesResponse = await fetch(`${API_URL}/availability/dates?days=7`);
    const dates = await datesResponse.json();
    console.log(`✅ ${dates.length} datas disponíveis encontradas`);

    if (dates.length === 0) {
      console.log('❌ Nenhuma data disponível. Configure os horários de trabalho.');
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
      console.log('❌ Nenhum horário disponível nesta data.');
      return;
    }

    console.log(`⏰ Usando horário: ${slotDisponivel.horario}\n`);

    // 3. Buscar preços
    console.log('💰 3. Buscando preços...');
    const pricesResponse = await fetch(`${API_URL}/availability/prices`);
    const prices = await pricesResponse.json();
    console.log('✅ Preços:', {
      cautelar: `R$ ${(prices.cautelar.valor / 100).toFixed(2)}`,
      transferencia: `R$ ${(prices.transferencia.valor / 100).toFixed(2)}`,
      outros: `R$ ${(prices.outros.valor / 100).toFixed(2)}`
    });
    console.log('');

    // 4. Criar agendamento
    console.log('📋 4. Criando agendamento...');
    const agendamentoData = {
      cliente: {
        nome: 'Teste Agendamento',
        cpf: '123.456.789-09',
        telefone: '(67) 99999-9999',
        email: 'teste@agendaaqui.com'
      },
      veiculo: {
        placa: 'TEST-123',
        marca: 'Teste',
        modelo: 'Teste',
        ano: 2023,
        chassi: null
      },
      tipo_vistoria: 'cautelar',
      data: primeiraData,
      horario: slotDisponivel.horario,
      endereco_vistoria: 'Rua Teste, 123'
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
    console.log(`   Status: ${agendamento.status}`);
    console.log('');

    // 5. Gerar PIX
    console.log('💳 5. Gerando pagamento PIX...');
    const pixData = {
      transaction_amount: prices.cautelar.valor / 100,
      description: `Vistoria Cautelar - ${agendamento.protocolo}`,
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
      console.log('\n⚠️  IMPORTANTE: Verifique se as variáveis de ambiente MP_ACCESS_TOKEN e MP_PUBLIC_KEY estão configuradas no Render!');
      return;
    }

    const pixPayment = await pixResponse.json();
    console.log('✅ PIX gerado com sucesso!');
    console.log(`   Payment ID: ${pixPayment.payment_id}`);
    console.log(`   Status: ${pixPayment.status}`);
    console.log(`   QR Code presente: ${!!pixPayment.qr_code ? 'Sim ✅' : 'Não ❌'}`);
    console.log(`   QR Code Base64 presente: ${!!pixPayment.qr_code_base64 ? 'Sim ✅' : 'Não ❌'}`);

    if (pixPayment.qr_code) {
      console.log(`\n📱 Código PIX (primeiros 50 caracteres):`);
      console.log(`   ${pixPayment.qr_code.substring(0, 50)}...`);
    }

    console.log('\n✅ TESTE COMPLETO COM SUCESSO!');
    console.log('\n📝 Resumo:');
    console.log(`   - Agendamento ID: ${agendamento.id}`);
    console.log(`   - Protocolo: ${agendamento.protocolo}`);
    console.log(`   - Data: ${primeiraData} às ${slotDisponivel.horario}`);
    console.log(`   - Valor: R$ ${(prices.cautelar.valor / 100).toFixed(2)}`);
    console.log(`   - Payment ID MP: ${pixPayment.payment_id}`);

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPaymentFlow();
