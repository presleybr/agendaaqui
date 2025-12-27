const express = require('express');
const router = express.Router();
const { getInstance: getAsaasService } = require('../services/AsaasService');
const { getInstance: getAsaasPaymentService } = require('../services/AsaasPaymentService');
const PixTransferService = require('../services/PixTransferService');
const AsaasPaymentController = require('../controllers/asaasPaymentController');
const Transacao = require('../models/Transacao');
const { requireSuperAdmin } = require('../middleware/authAdmin');

/**
 * Rotas de integração com a Asaas
 * Prefixo: /api/asaas
 *
 * PAGAMENTOS:
 * - POST /api/asaas/payment/pix - Criar cobrança PIX
 * - GET /api/asaas/payment/status/:id - Consultar status
 * - POST /api/asaas/payment/webhook - Webhook de pagamentos
 * - DELETE /api/asaas/payment/:id - Cancelar pagamento
 *
 * TRANSFERÊNCIAS:
 * - POST /api/asaas/webhook - Webhook de transferências
 * - GET /api/asaas/transferencias - Listar transferências
 * - POST /api/asaas/transferir - Transferência manual
 */

// ═══════════════════════════════════════════════════════════════
// PAGAMENTOS - Cobranças PIX
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/asaas/payment/pix
 * Cria uma cobrança PIX para pagamento
 */
router.post('/payment/pix', AsaasPaymentController.criarPixPayment);

/**
 * GET /api/asaas/payment/status/:paymentId
 * Consulta status de um pagamento
 */
router.get('/payment/status/:paymentId', AsaasPaymentController.consultarStatus);

/**
 * POST /api/asaas/payment/webhook
 * Recebe webhooks de pagamento da Asaas
 */
router.post('/payment/webhook', AsaasPaymentController.webhook);

/**
 * DELETE /api/asaas/payment/:paymentId
 * Cancela um pagamento
 */
router.delete('/payment/:paymentId', AsaasPaymentController.cancelarPagamento);

// ═══════════════════════════════════════════════════════════════
// WEBHOOK - Recebe eventos da Asaas
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/asaas/webhook
 * Recebe webhooks da Asaas para eventos de transferência
 * Documentação: https://docs.asaas.com/docs/transfer-events
 */
router.post('/webhook', async (req, res) => {
  try {
    const evento = req.body;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 WEBHOOK ASAAS RECEBIDO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Evento: ${evento.event}`);
    console.log(`   Transfer ID: ${evento.transfer?.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const asaas = getAsaasService();
    const resultado = await asaas.processarWebhook(evento);

    // Atualizar transação no banco se houver ID
    if (evento.transfer?.id) {
      // Buscar transação pelo pix_txid (ID da Asaas)
      const transacao = await Transacao.findByPixTxid(evento.transfer.id);

      if (transacao) {
        let novoStatus = transacao.status;
        let pixStatus = transacao.pix_status;

        switch (resultado.tipo) {
          case 'transferencia_concluida':
            novoStatus = 'processado';
            pixStatus = 'confirmado';
            break;
          case 'transferencia_falhou':
          case 'transferencia_cancelada':
            novoStatus = 'erro';
            pixStatus = 'erro';
            break;
          case 'transferencia_processando':
            pixStatus = 'processando';
            break;
        }

        await Transacao.updateStatus(transacao.id, novoStatus, {
          pix_status: pixStatus,
          pix_detalhes: JSON.stringify({
            ...JSON.parse(transacao.pix_detalhes || '{}'),
            webhook_evento: resultado.tipo,
            webhook_recebido_em: new Date().toISOString(),
            asaas_status: evento.transfer?.status
          })
        });

        console.log(`✅ Transação #${transacao.id} atualizada: ${pixStatus}`);
      }
    }

    res.status(200).json({ received: true, tipo: resultado.tipo });

  } catch (error) {
    console.error('❌ Erro ao processar webhook Asaas:', error);
    // Sempre retorna 200 para não reprocessar
    res.status(200).json({ received: true, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN - Rotas protegidas para gestão
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/asaas/status
 * Retorna status da integração com Asaas
 */
router.get('/status', requireSuperAdmin, async (req, res) => {
  try {
    const pixService = new PixTransferService();
    const status = pixService.getStatus();

    // Tentar consultar saldo se configurado
    let saldo = null;
    if (status.asaas_configurado) {
      try {
        saldo = await pixService.consultarSaldo();
      } catch (e) {
        saldo = { erro: e.message };
      }
    }

    res.json({
      ...status,
      saldo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao consultar status Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/asaas/saldo
 * Consulta saldo disponível na conta Asaas
 */
router.get('/saldo', requireSuperAdmin, async (req, res) => {
  try {
    const pixService = new PixTransferService();
    const saldo = await pixService.consultarSaldo();

    res.json(saldo);

  } catch (error) {
    console.error('❌ Erro ao consultar saldo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/asaas/transferencias
 * Lista transferências realizadas via Asaas
 */
router.get('/transferencias', requireSuperAdmin, async (req, res) => {
  try {
    const { data, status, limit = 50, offset = 0 } = req.query;

    const pixService = new PixTransferService();
    const resultado = await pixService.listarTransferencias({
      dateCreated: data,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(resultado);

  } catch (error) {
    console.error('❌ Erro ao listar transferências:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/asaas/transferencia/:id
 * Consulta uma transferência específica
 */
router.get('/transferencia/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const pixService = new PixTransferService();
    const resultado = await pixService.verificarStatusTransferencia(id);

    if (!resultado) {
      return res.status(404).json({ error: 'Transferência não encontrada' });
    }

    res.json(resultado);

  } catch (error) {
    console.error('❌ Erro ao consultar transferência:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/asaas/transferir
 * Realiza uma transferência PIX manual
 */
router.post('/transferir', requireSuperAdmin, async (req, res) => {
  try {
    const { chave_pix, valor, descricao, empresa_id, empresa_nome } = req.body;

    if (!chave_pix || !valor) {
      return res.status(400).json({
        error: 'Campos obrigatórios: chave_pix, valor'
      });
    }

    console.log('\n📤 Transferência manual solicitada');
    console.log(`   Chave PIX: ${chave_pix}`);
    console.log(`   Valor: R$ ${valor}`);

    const pixService = new PixTransferService();

    // Converter valor para centavos se necessário
    const valorCentavos = valor < 1000 ? valor * 100 : valor;

    const resultado = await pixService.transferirPix({
      chave_pix,
      valor: valorCentavos,
      empresa_nome: empresa_nome || 'Transferência Manual',
      empresa_id: empresa_id || 0,
      split_id: 0 // Manual
    });

    if (resultado.sucesso) {
      res.json({
        success: true,
        mensagem: 'Transferência realizada com sucesso',
        ...resultado
      });
    } else {
      res.status(400).json({
        success: false,
        error: resultado.mensagem,
        detalhes: resultado.erro
      });
    }

  } catch (error) {
    console.error('❌ Erro ao realizar transferência:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/asaas/validar-pix
 * Valida uma chave PIX
 */
router.post('/validar-pix', requireSuperAdmin, async (req, res) => {
  try {
    const { chave_pix } = req.body;

    if (!chave_pix) {
      return res.status(400).json({ error: 'Campo obrigatório: chave_pix' });
    }

    const asaas = getAsaasService();
    const resultado = await asaas.validarChavePix(chave_pix);

    res.json({
      chave_pix,
      ...resultado
    });

  } catch (error) {
    console.error('❌ Erro ao validar chave PIX:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/asaas/reprocessar/:transacaoId
 * Reprocessa uma transferência que falhou
 */
router.post('/reprocessar/:transacaoId', requireSuperAdmin, async (req, res) => {
  try {
    const { transacaoId } = req.params;

    // Buscar transação
    const transacao = await Transacao.findById(transacaoId);

    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    if (transacao.tipo !== 'repasse') {
      return res.status(400).json({ error: 'Apenas transações de repasse podem ser reprocessadas' });
    }

    if (transacao.status === 'processado' && transacao.pix_status === 'confirmado') {
      return res.status(400).json({ error: 'Transação já foi processada com sucesso' });
    }

    console.log(`\n🔄 Reprocessando transação #${transacaoId}`);

    const pixService = new PixTransferService();

    const resultado = await pixService.transferirPix({
      chave_pix: transacao.pix_key,
      valor: transacao.valor,
      empresa_nome: `Reprocessamento - Transação #${transacaoId}`,
      empresa_id: transacao.empresa_id,
      split_id: transacao.id
    });

    if (resultado.sucesso) {
      await Transacao.updateStatus(transacao.id, 'processado', {
        pix_status: 'enviado',
        pix_txid: resultado.comprovante,
        pix_tipo: resultado.tipo,
        pix_ambiente: resultado.ambiente,
        pix_detalhes: JSON.stringify({
          ...JSON.parse(transacao.pix_detalhes || '{}'),
          reprocessado_em: new Date().toISOString(),
          ...resultado.detalhes
        })
      });

      res.json({
        success: true,
        mensagem: 'Transferência reprocessada com sucesso',
        ...resultado
      });
    } else {
      await Transacao.updateStatus(transacao.id, 'erro', {
        pix_status: 'erro',
        erro_mensagem: resultado.mensagem,
        pix_detalhes: JSON.stringify({
          ...JSON.parse(transacao.pix_detalhes || '{}'),
          tentativa_reprocessamento: new Date().toISOString(),
          erro: resultado.mensagem
        })
      });

      res.status(400).json({
        success: false,
        error: resultado.mensagem
      });
    }

  } catch (error) {
    console.error('❌ Erro ao reprocessar transferência:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
