const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const Pagamento = require('../models/Pagamento');
const Agendamento = require('../models/Agendamento');
const SplitPaymentService = require('../services/splitPayment');

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);
const preference = new Preference(client);

class PaymentController {
  // Create PIX payment
  static async createPixPayment(req, res) {
    try {
      const {
        transaction_amount,
        description,
        payer_email,
        payer_first_name,
        payer_last_name,
        payer_identification_type,
        payer_identification_number,
        agendamento_id
      } = req.body;

      const paymentData = {
        transaction_amount: Number(transaction_amount),
        description: description || 'Pagamento de Vistoria Veicular',
        payment_method_id: 'pix',
        payer: {
          email: payer_email,
          first_name: payer_first_name,
          last_name: payer_last_name,
          identification: {
            type: payer_identification_type || 'CPF',
            number: payer_identification_number
          }
        },
        metadata: {
          agendamento_id: agendamento_id
        }
      };

      const result = await payment.create({ body: paymentData });

      res.json({
        id: result.id,
        status: result.status,
        qr_code: result.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: result.point_of_interaction.transaction_data.ticket_url,
        payment_id: result.id
      });

    } catch (error) {
      console.error('Error creating PIX payment:', error);
      res.status(500).json({
        error: 'Erro ao criar pagamento PIX',
        details: error.message
      });
    }
  }

  // Create Card payment
  static async createCardPayment(req, res) {
    try {
      const {
        transaction_amount,
        token,
        description,
        installments,
        payment_method_id,
        payer_email,
        payer_first_name,
        payer_last_name,
        payer_identification_type,
        payer_identification_number,
        agendamento_id
      } = req.body;

      const paymentData = {
        transaction_amount: Number(transaction_amount),
        token: token,
        description: description || 'Pagamento de Vistoria Veicular',
        installments: Number(installments) || 1,
        payment_method_id: payment_method_id,
        payer: {
          email: payer_email,
          first_name: payer_first_name,
          last_name: payer_last_name,
          identification: {
            type: payer_identification_type || 'CPF',
            number: payer_identification_number
          }
        },
        metadata: {
          agendamento_id: agendamento_id
        }
      };

      const result = await payment.create({ body: paymentData });

      res.json({
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        payment_id: result.id,
        payment_method_id: result.payment_method_id,
        payment_type_id: result.payment_type_id
      });

    } catch (error) {
      console.error('Error creating card payment:', error);
      res.status(500).json({
        error: 'Erro ao criar pagamento com cartão',
        details: error.message
      });
    }
  }

  // Get payment status
  static async getPaymentStatus(req, res) {
    try {
      const { payment_id } = req.params;

      const result = await payment.get({ id: payment_id });

      res.json({
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        payment_method_id: result.payment_method_id,
        payment_type_id: result.payment_type_id,
        transaction_amount: result.transaction_amount,
        date_approved: result.date_approved,
        date_created: result.date_created
      });

    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({
        error: 'Erro ao buscar status do pagamento',
        details: error.message
      });
    }
  }

  // Webhook to receive payment notifications
  static async webhook(req, res) {
    try {
      const { type, data } = req.body;

      console.log('📥 Webhook received:', { type, data });

      if (type === 'payment') {
        const paymentId = data.id;

        // Get payment details from Mercado Pago
        const paymentInfo = await payment.get({ id: paymentId });

        console.log('💳 Payment webhook:', {
          id: paymentInfo.id,
          status: paymentInfo.status,
          amount: paymentInfo.transaction_amount,
          metadata: paymentInfo.metadata
        });

        const agendamentoId = paymentInfo.metadata?.agendamento_id;

        if (!agendamentoId) {
          console.warn('⚠️  Webhook sem agendamento_id');
          return res.status(200).send('OK - No agendamento_id');
        }

        // Buscar agendamento para pegar empresa_id
        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
          console.error('❌ Agendamento não encontrado:', agendamentoId);
          return res.status(200).send('OK - Agendamento not found');
        }

        // Verificar se já existe pagamento com este mp_payment_id
        let pagamentoDB = await Pagamento.findByMpPaymentId(paymentId);

        if (!pagamentoDB) {
          // Criar novo pagamento no banco
          pagamentoDB = await Pagamento.create({
            agendamento_id: agendamentoId,
            empresa_id: agendamento.empresa_id,
            mp_payment_id: paymentId,
            tipo_pagamento: paymentInfo.payment_type_id,
            valor: Math.round(paymentInfo.transaction_amount * 100), // converter para centavos
            status: paymentInfo.status,
            qr_code: paymentInfo.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: paymentInfo.point_of_interaction?.transaction_data?.qr_code_base64,
            payment_method_id: paymentInfo.payment_method_id,
            installments: paymentInfo.installments || 1,
            dados_pagamento: {
              status_detail: paymentInfo.status_detail,
              date_approved: paymentInfo.date_approved,
              date_created: paymentInfo.date_created,
              payer: paymentInfo.payer
            },
            data_pagamento: paymentInfo.date_approved || paymentInfo.date_created
          });

          console.log('✅ Pagamento criado no banco:', pagamentoDB.id);
        } else {
          // Atualizar status do pagamento existente
          pagamentoDB = await Pagamento.update(pagamentoDB.id, {
            status: paymentInfo.status,
            dados_pagamento: {
              status_detail: paymentInfo.status_detail,
              date_approved: paymentInfo.date_approved,
              date_created: paymentInfo.date_created,
              payer: paymentInfo.payer
            },
            data_pagamento: paymentInfo.date_approved || paymentInfo.date_created
          });

          console.log('🔄 Pagamento atualizado no banco:', pagamentoDB.id);
        }

        // Se pagamento foi aprovado, processar split
        if (paymentInfo.status === 'approved') {
          console.log('✅ Pagamento aprovado! Processando split...');

          try {
            // Processar split de pagamento
            const splitResult = await SplitPaymentService.processar(pagamentoDB.id);

            console.log('💰 Split processado:', splitResult);

            // Atualizar status do agendamento para confirmado
            await Agendamento.update(agendamentoId, {
              status: 'confirmado',
              pagamento_confirmado: true
            });

            console.log('✅ Agendamento confirmado:', agendamentoId);

            // Log do split para o admin
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💸 SPLIT DE PAGAMENTO REALIZADO');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   Pagamento: #${pagamentoDB.id} (MP: ${paymentId})`);
            console.log(`   Valor Total: R$ ${(splitResult.valor_total / 100).toFixed(2)}`);
            console.log(`   Taxa Sistema: R$ ${(splitResult.taxa / 100).toFixed(2)}`);
            console.log(`   Valor Empresa: R$ ${(splitResult.valor_empresa / 100).toFixed(2)}`);
            console.log(`   Empresa: ${splitResult.empresa.nome}`);
            console.log(`   PIX: ${splitResult.empresa.pix_key}`);
            console.log(`   Transação Repasse: #${splitResult.transacao_repasse_id}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');

          } catch (splitError) {
            console.error('❌ Erro ao processar split:', splitError);
            // Não falha o webhook, apenas loga o erro
          }
        } else if (paymentInfo.status === 'cancelled' || paymentInfo.status === 'rejected') {
          // Atualizar agendamento para cancelado/rejeitado
          await Agendamento.update(agendamentoId, {
            status: 'cancelado',
            pagamento_confirmado: false
          });

          console.log('❌ Pagamento cancelado/rejeitado. Agendamento cancelado.');
        }
      }

      res.status(200).send('OK');

    } catch (error) {
      console.error('❌ Webhook error:', error);
      // Sempre retorna 200 para o Mercado Pago não reenviar
      res.status(200).send('OK - Error logged');
    }
  }

  // Get public key for frontend
  static getPublicKey(req, res) {
    res.json({
      public_key: process.env.MP_PUBLIC_KEY
    });
  }

  // Get installments options
  static async getInstallments(req, res) {
    try {
      const { amount, payment_method_id } = req.query;

      // For now, return basic installment options
      // In production, you should use MP API to get real installment options
      const installments = [];
      const maxInstallments = 12;

      for (let i = 1; i <= maxInstallments; i++) {
        installments.push({
          installments: i,
          installment_amount: (Number(amount) / i).toFixed(2),
          total_amount: Number(amount)
        });
      }

      res.json({ installments });

    } catch (error) {
      console.error('Error getting installments:', error);
      res.status(500).json({
        error: 'Erro ao buscar parcelas',
        details: error.message
      });
    }
  }
}

module.exports = PaymentController;
