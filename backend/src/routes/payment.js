const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');
const Pagamento = require('../models/Pagamento');
const Agendamento = require('../models/Agendamento');
const PaymentSplitService = require('../services/PaymentSplitService');
const db = require('../config/database');

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});
const payment = new Payment(client);

/**
 * POST /api/payment/pix
 * Create PIX payment
 */
router.post('/pix', async (req, res) => {
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

    // Validate required fields
    if (!transaction_amount || !payer_email || !agendamento_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando'
      });
    }

    // Check if agendamento exists
    const agendamento = Agendamento.findById(agendamento_id);
    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Create payment in Mercado Pago
    const paymentData = {
      transaction_amount: Number(transaction_amount),
      description: description || 'Vistoria Veicular',
      payment_method_id: 'pix',
      payer: {
        email: payer_email,
        first_name: payer_first_name,
        last_name: payer_last_name,
        identification: {
          type: payer_identification_type || 'CPF',
          number: payer_identification_number
        }
      }
    };

    const mpPayment = await payment.create({ body: paymentData });

    // Save payment in database
    const pagamentoRecord = await Pagamento.create({
      agendamento_id,
      mp_payment_id: mpPayment.id.toString(),
      tipo_pagamento: 'pix',
      valor: Math.round(transaction_amount * 100), // Convert to cents
      status: mpPayment.status,
      qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      dados_pagamento: mpPayment
    });

    // Process payment split if agendamento has empresa_id
    if (agendamento.empresa_id) {
      try {
        await PaymentSplitService.processarPagamento(
          pagamentoRecord.id,
          agendamento.empresa_id,
          Math.round(transaction_amount * 100)
        );
        console.log(`✅ Split processado para pagamento ${pagamentoRecord.id}`);
      } catch (splitError) {
        console.error('⚠️ Erro ao processar split (pagamento criado):', splitError);
        // Não bloqueia o pagamento se split falhar
      }
    }

    res.json({
      payment_id: mpPayment.id.toString(),
      status: mpPayment.status,
      qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: mpPayment.point_of_interaction?.transaction_data?.ticket_url
    });

  } catch (error) {
    console.error('Error creating PIX payment:', error);
    res.status(500).json({
      error: 'Erro ao criar pagamento PIX',
      details: error.message
    });
  }
});

/**
 * POST /api/payment/card
 * Create card payment
 */
router.post('/card', async (req, res) => {
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

    // Validate required fields
    if (!transaction_amount || !token || !payer_email || !agendamento_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando'
      });
    }

    // Check if agendamento exists
    const agendamento = Agendamento.findById(agendamento_id);
    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Create payment in Mercado Pago
    const paymentData = {
      transaction_amount: Number(transaction_amount),
      token: token,
      description: description || 'Vistoria Veicular',
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
      }
    };

    const mpPayment = await payment.create({ body: paymentData });

    // Save payment in database
    const pagamentoRecord = await Pagamento.create({
      agendamento_id,
      mp_payment_id: mpPayment.id.toString(),
      tipo_pagamento: 'credito',
      valor: Math.round(transaction_amount * 100), // Convert to cents
      status: mpPayment.status,
      payment_method_id: mpPayment.payment_method_id,
      installments: mpPayment.installments,
      dados_pagamento: mpPayment,
      data_pagamento: mpPayment.status === 'approved' ? new Date().toISOString() : null
    });

    // Update agendamento status if payment is approved
    if (mpPayment.status === 'approved') {
      await db.query(`
        UPDATE agendamentos
        SET status = 'confirmado', pagamento_confirmado = true
        WHERE id = $1
      `, [agendamento_id]);

      // Process payment split if agendamento has empresa_id
      if (agendamento.empresa_id) {
        try {
          await PaymentSplitService.processarPagamento(
            pagamentoRecord.id,
            agendamento.empresa_id,
            Math.round(transaction_amount * 100)
          );
          console.log(`✅ Split processado para pagamento ${pagamentoRecord.id}`);
        } catch (splitError) {
          console.error('⚠️ Erro ao processar split (pagamento aprovado):', splitError);
          // Não bloqueia o pagamento se split falhar
        }
      }
    }

    res.json({
      payment_id: mpPayment.id.toString(),
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      installments: mpPayment.installments,
      transaction_amount: mpPayment.transaction_amount
    });

  } catch (error) {
    console.error('Error creating card payment:', error);
    res.status(500).json({
      error: 'Erro ao processar pagamento com cartão',
      details: error.message
    });
  }
});

/**
 * GET /api/payment/status/:paymentId
 * Check payment status
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment from Mercado Pago
    const mpPayment = await payment.get({ id: paymentId });

    // Update payment in database
    const pagamentoRecord = await Pagamento.findByMpPaymentId(paymentId);

    if (pagamentoRecord) {
      await Pagamento.update(pagamentoRecord.id, {
        status: mpPayment.status,
        dados_pagamento: mpPayment,
        data_pagamento: mpPayment.status === 'approved' ? new Date().toISOString() : pagamentoRecord.data_pagamento
      });

      // Update agendamento status if payment is approved
      if (mpPayment.status === 'approved') {
        const agendamento = await Agendamento.findById(pagamentoRecord.agendamento_id);
        if (agendamento && agendamento.status !== 'confirmado') {
          await db.query(`
            UPDATE agendamentos
            SET status = 'confirmado', pagamento_confirmado = true
            WHERE id = $1
          `, [pagamentoRecord.agendamento_id]);

          // Process payment split if agendamento has empresa_id
          if (agendamento.empresa_id) {
            try {
              await PaymentSplitService.processarPagamento(
                pagamentoRecord.id,
                agendamento.empresa_id,
                pagamentoRecord.valor
              );
              console.log(`✅ Split processado via status check para pagamento ${pagamentoRecord.id}`);
            } catch (splitError) {
              console.error('⚠️ Erro ao processar split (status check):', splitError);
              // Não bloqueia o fluxo se split falhar
            }
          }
        }
      }
    }

    res.json({
      payment_id: mpPayment.id.toString(),
      status: mpPayment.status,
      status_detail: mpPayment.status_detail
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      error: 'Erro ao verificar status do pagamento',
      details: error.message
    });
  }
});

/**
 * POST /api/payment/webhook
 * Webhook to receive payment notifications from Mercado Pago
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data, action } = req.body;

    console.log('📥 Webhook received:', JSON.stringify({ type, action, data }, null, 2));

    // Responder imediatamente para o Mercado Pago
    res.status(200).json({ received: true });

    // Processar o webhook de forma assíncrona
    if (type === 'payment' || action === 'payment.updated') {
      const paymentId = data.id;

      if (!paymentId) {
        console.log('⚠️ Payment ID not found in webhook');
        return;
      }

      // Verificar se o Access Token está configurado
      if (!process.env.MP_ACCESS_TOKEN) {
        console.log('⚠️ MP_ACCESS_TOKEN not configured. Skipping webhook processing.');
        return;
      }

      try {
        // Get payment details from Mercado Pago
        const mpPayment = await payment.get({ id: paymentId });

        console.log('💳 Payment status:', mpPayment.status);

        // Update payment in database
        const pagamentoRecord = await Pagamento.findByMpPaymentId(paymentId.toString());

        if (pagamentoRecord) {
          await Pagamento.update(pagamentoRecord.id, {
            status: mpPayment.status,
            dados_pagamento: mpPayment,
            data_pagamento: mpPayment.status === 'approved' ? new Date().toISOString() : pagamentoRecord.data_pagamento
          });

          console.log('✅ Payment updated in database');

          // Update agendamento status if approved
          if (mpPayment.status === 'approved') {
            const agendamento = await Agendamento.findById(pagamentoRecord.agendamento_id);
            if (agendamento) {
              await db.query(`
                UPDATE agendamentos
                SET status = 'confirmado', pagamento_confirmado = true
                WHERE id = $1
              `, [pagamentoRecord.agendamento_id]);

              console.log('✅ Agendamento confirmed:', agendamento.protocolo);

              // Process payment split if agendamento has empresa_id
              if (agendamento.empresa_id) {
                try {
                  await PaymentSplitService.processarPagamento(
                    pagamentoRecord.id,
                    agendamento.empresa_id,
                    pagamentoRecord.valor
                  );
                  console.log(`✅ Split processado via webhook para pagamento ${pagamentoRecord.id}`);
                } catch (splitError) {
                  console.error('⚠️ Erro ao processar split (webhook):', splitError);
                  // Não bloqueia o fluxo se split falhar
                }
              }
            }
          }
        } else {
          console.log('⚠️ Payment not found in database:', paymentId);
        }
      } catch (error) {
        console.error('❌ Error processing payment from Mercado Pago:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Já enviamos o status 200, então não precisamos fazer nada aqui
  }
});

module.exports = router;
