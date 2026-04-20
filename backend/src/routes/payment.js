const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const Pagamento = require('../models/Pagamento');
const Agendamento = require('../models/Agendamento');
const { generateBRCode } = require('../utils/pixBRCode');
const db = require('../config/database');
const NotificationDispatcher = require('../services/NotificationDispatcher');

const comprovanteDir = path.join(__dirname, '../../../uploads/comprovantes');
if (!fs.existsSync(comprovanteDir)) fs.mkdirSync(comprovanteDir, { recursive: true });

const comprovanteUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, comprovanteDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `comp-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|pdf/.test(file.mimetype) ||
               /\.(jpe?g|png|webp|pdf)$/i.test(file.originalname);
    cb(ok ? null : new Error('Formato invalido (use JPG, PNG, WEBP ou PDF)'), ok);
  }
}).single('comprovante');

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
      description,
      payer_email,
      payer_first_name,
      payer_last_name,
      payer_identification_type,
      payer_identification_number,
      agendamento_id
    } = req.body;

    // Validate required fields
    if (!payer_email || !agendamento_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando'
      });
    }

    // Check if agendamento exists — fonte de verdade do valor (evita tampering)
    const agendamento = await Agendamento.findById(agendamento_id);
    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Valida empresa ativa (multi-tenant)
    if (agendamento.empresa_id) {
      const empresaCheck = await db.query(
        `SELECT status FROM empresas WHERE id = $1`,
        [agendamento.empresa_id]
      );
      if (!empresaCheck.rows[0] || (empresaCheck.rows[0].status && empresaCheck.rows[0].status !== 'ativo')) {
        return res.status(403).json({ error: 'Empresa inativa ou suspensa' });
      }
    }

    // Valor do agendamento (em reais) — ignora qualquer transaction_amount vindo do body
    const transaction_amount = Number(agendamento.valor) / 100;
    if (!transaction_amount || transaction_amount <= 0) {
      return res.status(400).json({ error: 'Valor do agendamento inválido' });
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
    if (!token || !payer_email || !agendamento_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando'
      });
    }

    // Check if agendamento exists — fonte de verdade do valor (evita tampering)
    const agendamento = await Agendamento.findById(agendamento_id);
    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (agendamento.empresa_id) {
      const empresaCheck = await db.query(
        `SELECT status FROM empresas WHERE id = $1`,
        [agendamento.empresa_id]
      );
      if (!empresaCheck.rows[0] || (empresaCheck.rows[0].status && empresaCheck.rows[0].status !== 'ativo')) {
        return res.status(403).json({ error: 'Empresa inativa ou suspensa' });
      }
    }

    const transaction_amount = Number(agendamento.valor) / 100;
    if (!transaction_amount || transaction_amount <= 0) {
      return res.status(400).json({ error: 'Valor do agendamento inválido' });
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
        SET status = 'confirmado', status_pagamento = 'aprovado', pagamento_confirmado = true
        WHERE id = $1
      `, [agendamento_id]);

      try {
        const ag = await Agendamento.findById(agendamento_id);
        if (ag) NotificationDispatcher.notifyPagamentoAprovado(ag).catch(() => {});
      } catch (_) {}
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
    console.log(`📡 Verificando status do pagamento: ${paymentId}`);

    // Get payment from Mercado Pago
    let mpPayment;
    try {
      mpPayment = await payment.get({ id: paymentId });
      console.log(`📦 Status MP: ${mpPayment.status} (${mpPayment.status_detail})`);
    } catch (mpError) {
      console.error('❌ Erro ao buscar pagamento no MP:', mpError.message);

      // Se for erro 404 do MP, retornar status pending (pagamento ainda não processado)
      if (mpError.status === 404 || mpError.cause?.[0]?.code === 2000) {
        return res.json({
          payment_id: paymentId,
          status: 'pending',
          status_detail: 'waiting_for_payment'
        });
      }
      throw mpError;
    }

    // Update payment in database (com try/catch separado)
    try {
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
              SET status = 'confirmado', status_pagamento = 'aprovado', pagamento_confirmado = true
              WHERE id = $1
            `, [pagamentoRecord.agendamento_id]);
            console.log(`✅ Agendamento ${pagamentoRecord.agendamento_id} confirmado`);
          }
          if (agendamento) {
            NotificationDispatcher.notifyPagamentoAprovado(agendamento).catch(() => {});
          }
        }
      }
    } catch (dbError) {
      console.error('⚠️ Erro ao atualizar banco (não crítico):', dbError.message);
      // Não bloqueia - retorna status do MP mesmo assim
    }

    res.json({
      payment_id: mpPayment.id.toString(),
      status: mpPayment.status,
      status_detail: mpPayment.status_detail
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error.message);

    // Se for um erro 404 do Mercado Pago (pagamento não encontrado)
    if (error.status === 404 || error.cause?.[0]?.code === 2000) {
      return res.json({
        payment_id: req.params.paymentId,
        status: 'pending',
        status_detail: 'waiting_for_payment'
      });
    }

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
                SET status = 'confirmado', status_pagamento = 'aprovado', pagamento_confirmado = true
                WHERE id = $1
              `, [pagamentoRecord.agendamento_id]);

              console.log('✅ Agendamento confirmed:', agendamento.protocolo);

              NotificationDispatcher.notifyPagamentoAprovado(agendamento).catch(() => {});
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

/**
 * =============================================================================
 * PIX MANUAL (Copia e Cola offline — sem API, sem webhook)
 * =============================================================================
 * Fluxo:
 *   1) Frontend chama POST /pix-manual/gerar com agendamento_id.
 *   2) Backend monta BR Code com a chave da empresa dona do agendamento e
 *      responde com copia-e-cola + QR em base64. Status inicial: 'pending'.
 *   3) Cliente paga no banco e envia comprovante via POST
 *      /pix-manual/:pagamentoId/comprovante. Status -> 'aguardando_aprovacao'.
 *   4) Empresa aprova/rejeita pelo painel (rotas em painelEmpresa.js).
 */

function ascii(str, max) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .,\-\/]/g, '')
    .trim()
    .slice(0, max);
}

router.post('/pix-manual/gerar', async (req, res) => {
  try {
    const { agendamento_id } = req.body;
    if (!agendamento_id) {
      return res.status(400).json({ error: 'agendamento_id e obrigatorio' });
    }

    const agendamento = await Agendamento.findById(agendamento_id);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento nao encontrado' });

    const empresaRes = await db.query(
      `SELECT id, nome, chave_pix, pix_type, pix_titular, cidade, pix_manual_ativo, status
       FROM empresas WHERE id = $1`,
      [agendamento.empresa_id]
    );
    const empresa = empresaRes.rows[0];
    if (!empresa) return res.status(404).json({ error: 'Empresa nao encontrada' });
    if (empresa.status && empresa.status !== 'ativo') {
      return res.status(403).json({ error: 'Empresa inativa ou suspensa' });
    }
    if (!empresa.chave_pix || String(empresa.chave_pix).trim() === '') {
      return res.status(400).json({ error: 'Empresa nao configurou chave PIX' });
    }
    if (empresa.pix_manual_ativo === false) {
      return res.status(400).json({ error: 'PIX manual desativado para esta empresa' });
    }

    // Valor vem do agendamento (fonte de verdade) — ignora body para evitar tampering
    const valorNumerico = Number(agendamento.valor || 0) / 100;
    if (!valorNumerico || valorNumerico <= 0) {
      return res.status(400).json({ error: 'Valor invalido' });
    }

    const txid = `AG${agendamento.id}${Date.now().toString(36).toUpperCase()}`.slice(0, 25);
    const titular = ascii(empresa.pix_titular || empresa.nome || 'EMPRESA', 25) || 'EMPRESA';
    const cidade = ascii(empresa.cidade || 'BRASIL', 15) || 'BRASIL';

    const brCode = generateBRCode({
      pixKey: empresa.chave_pix,
      merchantName: titular,
      merchantCity: cidade,
      amount: valorNumerico,
      txid
    });

    const qrBase64 = await QRCode.toDataURL(brCode, { errorCorrectionLevel: 'M', margin: 1, width: 360 });

    const existing = await db.query(
      `SELECT id FROM pagamentos
       WHERE agendamento_id = $1 AND metodo_pagamento = 'pix_manual'
         AND status NOT IN ('approved','aprovado','rejected','rejeitado')
       ORDER BY id DESC LIMIT 1`,
      [agendamento_id]
    );

    let pagamentoId;
    const valorCentavos = Math.round(valorNumerico * 100);

    if (existing.rows[0]) {
      pagamentoId = existing.rows[0].id;
      await db.query(
        `UPDATE pagamentos SET
          pix_br_code = $1, pix_qr_base64 = $2, pix_txid = $3,
          valor_total = $4, status = 'pending', updated_at = NOW()
         WHERE id = $5`,
        [brCode, qrBase64, txid, valorCentavos, pagamentoId]
      );
    } else {
      const insert = await db.query(
        `INSERT INTO pagamentos (
          agendamento_id, empresa_id, metodo_pagamento, valor_total, status,
          pix_br_code, pix_qr_base64, pix_txid
        ) VALUES ($1, $2, 'pix_manual', $3, 'pending', $4, $5, $6)
        RETURNING id`,
        [agendamento_id, empresa.id, valorCentavos, brCode, qrBase64, txid]
      );
      pagamentoId = insert.rows[0].id;
    }

    res.json({
      pagamento_id: pagamentoId,
      br_code: brCode,
      qr_code_base64: qrBase64,
      txid,
      valor: valorNumerico,
      titular,
      cidade,
      chave_pix: empresa.chave_pix,
      pix_type: empresa.pix_type,
      status: 'pending'
    });
  } catch (err) {
    console.error('Erro pix-manual/gerar:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/pix-manual/:pagamentoId', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, agendamento_id, empresa_id, valor_total, status,
              pix_br_code, pix_qr_base64, pix_txid, comprovante_url,
              comprovante_enviado_em, aprovado_em, rejeitado_em, rejeicao_motivo
       FROM pagamentos WHERE id = $1`,
      [req.params.pagamentoId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Pagamento nao encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pix-manual/:pagamentoId/comprovante', (req, res) => {
  comprovanteUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    try {
      const { pagamentoId } = req.params;
      const url = '/uploads/comprovantes/' + req.file.filename;
      const upd = await db.query(
        `UPDATE pagamentos
         SET comprovante_url = $1,
             comprovante_enviado_em = NOW(),
             status = 'aguardando_aprovacao',
             updated_at = NOW()
         WHERE id = $2 AND metodo_pagamento = 'pix_manual'
         RETURNING id, agendamento_id, status, comprovante_url`,
        [url, pagamentoId]
      );
      if (!upd.rows[0]) return res.status(404).json({ error: 'Pagamento nao encontrado' });

      // Dispara o comprovante pro gerente via WhatsApp (fire-and-forget).
      Agendamento.findById(upd.rows[0].agendamento_id).then(ag => {
        if (ag) NotificationDispatcher.notifyComprovanteEnviado(ag, url).catch(() => {});
      }).catch(() => {});

      res.json({ success: true, pagamento: upd.rows[0] });
    } catch (e) {
      console.error('Erro upload comprovante:', e);
      res.status(500).json({ error: e.message });
    }
  });
});

module.exports = router;
