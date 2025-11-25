#!/usr/bin/env node

/**
 * 🔴 TESTE COM CREDENCIAIS DE PRODUÇÃO
 *
 * ⚠️  ATENÇÃO: Este teste vai gerar um pagamento PIX REAL!
 * Só execute se estiver pronto para fazer um pagamento de verdade.
 */

const API_URL = 'https://agendaaqui-backend.onrender.com/api';

async function testProductionPayment() {
  console.log('🔴 TESTE COM CREDENCIAIS DE PRODUÇÃO\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('⚠️  ATENÇÃO: Este vai gerar um pagamento PIX REAL!');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Buscar disponibilidade
    console.log('📅 Buscando horários disponíveis...');
    const datesResponse = await fetch(`${API_URL}/availability/dates?days=7`);
    const dates = await datesResponse.json();

    if (dates.length === 0) {
      console.log('❌ Nenhuma data disponível');
      return;
    }

    const primeiraData = dates[0].data;

    const slotsResponse = await fetch(`${API_URL}/availability/slots?data=${primeiraData}`);
    const slots = await slotsResponse.json();
    const slotDisponivel = slots.find(s => s.disponivel);

    if (!slotDisponivel) {
      console.log('❌ Nenhum horário disponível');
      return;
    }

    const pricesResponse = await fetch(`${API_URL}/availability/prices`);
    const prices = await pricesResponse.json();

    console.log(`✅ Data: ${primeiraData}`);
    console.log(`✅ Horário: ${slotDisponivel.horario}`);
    console.log(`✅ Preço: R$ ${(prices.cautelar.valor / 100).toFixed(2)}\n`);

    // 2. Criar agendamento
    console.log('📋 Criando agendamento de PRODUÇÃO...');

    const agendamentoData = {
      cliente: {
        nome: 'TESTE PRODUCAO',
        cpf: '123.456.789-09',
        telefone: '(67) 99999-0000',
        email: 'teste.producao@agendaaqui.com'
      },
      veiculo: {
        placa: 'PROD-001',
        marca: 'Teste',
        modelo: 'Producao',
        ano: 2024
      },
      tipo_vistoria: 'cautelar',
      data: primeiraData,
      horario: slotDisponivel.horario,
      endereco_vistoria: 'Rua Teste Producao, 123'
    };

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
    console.log(`✅ Agendamento criado!`);
    console.log(`   ID: ${agendamento.id}`);
    console.log(`   Protocolo: ${agendamento.protocolo}\n`);

    // 3. Gerar PIX DE PRODUÇÃO
    console.log('💳 Gerando PIX de PRODUÇÃO...');
    console.log('🔴 Este PIX será REAL e poderá ser pago!\n');

    const pixData = {
      transaction_amount: prices.cautelar.valor / 100,
      description: `Vistoria PRODUCAO - ${agendamento.protocolo}`,
      payer_email: agendamentoData.cliente.email,
      payer_first_name: 'TESTE',
      payer_last_name: 'PRODUCAO',
      payer_identification_type: 'CPF',
      payer_identification_number: '12345678909',
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
      console.log('\n⚠️  Verifique se as credenciais de PRODUÇÃO foram configuradas no Render!');
      return;
    }

    const pixPayment = await pixResponse.json();

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ PIX DE PRODUÇÃO GERADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📊 DETALHES DO PAGAMENTO:');
    console.log(`   Payment ID: ${pixPayment.payment_id}`);
    console.log(`   Status: ${pixPayment.status}`);
    console.log(`   Valor: R$ ${(prices.cautelar.valor / 100).toFixed(2)}\n`);

    console.log('📱 QR CODE PIX:');
    console.log(`   QR Code gerado: ${pixPayment.qr_code ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`   QR Code Base64: ${pixPayment.qr_code_base64 ? 'SIM ✅' : 'NÃO ❌'}\n`);

    if (pixPayment.qr_code) {
      console.log('📋 CÓDIGO PIX COPIA E COLA:');
      console.log('─────────────────────────────────────────────────');
      console.log(pixPayment.qr_code);
      console.log('─────────────────────────────────────────────────\n');
    }

    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Copie o código PIX acima');
    console.log('   2. Abra o app do seu banco');
    console.log('   3. Escolha PIX → Pagar com QR Code ou Código');
    console.log('   4. Cole o código ou escaneie o QR Code');
    console.log('   5. Confirme o pagamento\n');

    console.log('📊 DADOS DO AGENDAMENTO:');
    console.log(`   Protocolo: ${agendamento.protocolo}`);
    console.log(`   Data: ${primeiraData} às ${slotDisponivel.horario}`);
    console.log(`   Cliente: ${agendamentoData.cliente.nome}`);
    console.log(`   Veículo: ${agendamentoData.veiculo.placa}\n`);

    console.log('🔔 WEBHOOK:');
    console.log('   Quando você pagar o PIX, o Mercado Pago vai enviar');
    console.log('   um webhook para o backend e o status do agendamento');
    console.log('   será atualizado automaticamente para "confirmado".\n');

    console.log('✅ Teste de produção concluído!');
    console.log('   Agora você pode testar o pagamento real.\n');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar
testProductionPayment();
