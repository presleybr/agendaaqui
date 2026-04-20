/**
 * Controller de Pagamentos via Asaas
 *
 * Endpoints:
 * - POST /api/asaas/payment/pix - Criar cobrança PIX
 * - GET /api/asaas/payment/status/:id - Consultar status
 * - POST /api/asaas/payment/webhook - Receber notificações
 */

const { getInstance: getAsaasPaymentService } = require('../services/AsaasPaymentService');
const { getInstance: getAsaasService } = require('../services/AsaasService');
const Pagamento = require('../models/Pagamento');
const Agendamento = require('../models/Agendamento');
const Empresa = require('../models/Empresa');
const Transacao = require('../models/Transacao');
const { TAXA_PIX_ASAAS } = require('../config/taxas');

class AsaasPaymentController {
  /**
   * Criar cobrança PIX
   * POST /api/asaas/payment/pix
   */
  static async criarPixPayment(req, res) {
    try {
      const {
        agendamento_id,
        cliente_nome,
        cliente_cpf,
        cliente_email,
        cliente_telefone
      } = req.body;

      // Validar campos obrigatórios
      if (!agendamento_id || !cliente_nome || !cliente_cpf) {
        return res.status(400).json({
          error: 'Campos obrigatórios: agendamento_id, cliente_nome, cliente_cpf'
        });
      }

      // Buscar agendamento
      const agendamento = await Agendamento.findById(agendamento_id);
      if (!agendamento) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar se já existe pagamento aprovado
      const pagamentosExistentes = await Pagamento.findByAgendamentoId(agendamento_id);
      const pagamentoAprovado = pagamentosExistentes.find(p =>
        p.status === 'approved' || p.status === 'RECEIVED' || p.status === 'CONFIRMED'
      );

      if (pagamentoAprovado) {
        return res.status(400).json({
          error: 'Este agendamento já possui um pagamento aprovado'
        });
      }

      // Obter serviço Asaas
      const asaasPayment = getAsaasPaymentService();

      if (!asaasPayment.isReady()) {
        return res.status(500).json({
          error: 'Serviço de pagamento não configurado'
        });
      }

      // Buscar ou criar cliente na Asaas
      console.log('👤 Processando cliente na Asaas...');
      const clienteAsaas = await asaasPayment.buscarOuCriarCliente({
        nome: cliente_nome,
        cpf: cliente_cpf,
        email: cliente_email,
        telefone: cliente_telefone
      });

      // Calcular valor (já inclui taxa PIX)
      const valorTotal = agendamento.valor; // Já vem com taxa PIX do agendamentoController
      const valorReais = valorTotal / 100;

      console.log('💳 Criando cobrança PIX...');
      console.log(`   Valor: R$ ${valorReais.toFixed(2)}`);
      console.log(`   Agendamento: #${agendamento_id}`);

      // Criar cobrança PIX
      const cobranca = await asaasPayment.criarCobrancaPix({
        clienteAsaasId: clienteAsaas.id,
        valor: valorReais,
        descricao: `Vistoria Veicular - Protocolo ${agendamento.protocolo}`,
        externalReference: agendamento_id.toString()
      });

      // Salvar pagamento no banco
      const pagamento = await Pagamento.create({
        agendamento_id,
        empresa_id: agendamento.empresa_id,
        mp_payment_id: cobranca.cobrancaId, // Usando campo existente para ID Asaas
        tipo_pagamento: 'pix',
        metodo_pagamento: 'pix',
        valor: valorTotal,
        valor_total: valorTotal,
        status: 'pending',
        qr_code: cobranca.pixCopiaECola,
        qr_code_base64: cobranca.pixQrCodeBase64,
        dados_pagamento: {
          asaas_id: cobranca.cobrancaId,
          asaas_cliente_id: clienteAsaas.id,
          link_pagamento: cobranca.linkPagamento,
          vencimento: cobranca.vencimento,
          ambiente: asaasPayment.sandbox ? 'sandbox' : 'producao'
        }
      });

      console.log('✅ Pagamento criado:', pagamento.id);

      res.json({
        success: true,
        payment_id: cobranca.cobrancaId,
        pagamento_id: pagamento.id,
        status: cobranca.status,
        valor: valorReais,
        valor_centavos: valorTotal,
        qr_code: cobranca.pixCopiaECola,
        qr_code_base64: cobranca.pixQrCodeBase64,
        link_pagamento: cobranca.linkPagamento,
        vencimento: cobranca.vencimento,
        expiracao: cobranca.pixExpirationDate
      });

    } catch (error) {
      console.error('❌ Erro ao criar pagamento PIX:', error);
      res.status(500).json({
        error: 'Erro ao criar pagamento PIX',
        details: error.message
      });
    }
  }

  /**
   * Consultar status do pagamento
   * GET /api/asaas/payment/status/:paymentId
   */
  static async consultarStatus(req, res) {
    try {
      const { paymentId } = req.params;

      const asaasPayment = getAsaasPaymentService();

      if (!asaasPayment.isReady()) {
        return res.status(500).json({
          error: 'Serviço de pagamento não configurado'
        });
      }

      // Consultar na Asaas
      const cobranca = await asaasPayment.consultarCobranca(paymentId);

      // Atualizar no banco local
      const pagamentoLocal = await Pagamento.findByMpPaymentId(paymentId);
      if (pagamentoLocal) {
        const statusMapeado = asaasPayment.mapearStatus(cobranca.status);

        await Pagamento.update(pagamentoLocal.id, {
          status: statusMapeado === 'aprovado' ? 'approved' : cobranca.status,
          data_pagamento: cobranca.dataPagamento
        });

        // Se foi pago, processar split
        if (cobranca.status === 'RECEIVED' || cobranca.status === 'CONFIRMED') {
          await AsaasPaymentController.processarPagamentoAprovado(pagamentoLocal, cobranca);
        }
      }

      res.json({
        payment_id: cobranca.id,
        status: cobranca.status,
        status_interno: asaasPayment.mapearStatus(cobranca.status),
        valor: cobranca.valor,
        data_pagamento: cobranca.dataPagamento,
        link_pagamento: cobranca.linkPagamento
      });

    } catch (error) {
      console.error('❌ Erro ao consultar status:', error);
      res.status(500).json({
        error: 'Erro ao consultar status',
        details: error.message
      });
    }
  }

  /**
   * Webhook para receber notificações da Asaas
   * POST /api/asaas/payment/webhook
   */
  static async webhook(req, res) {
    try {
      const evento = req.body;

      console.log('\n📥 WEBHOOK ASAAS RECEBIDO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   Evento:', evento.event);
      console.log('   Payment ID:', evento.payment?.id);
      console.log('   Status:', evento.payment?.status);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Responder imediatamente
      res.status(200).json({ received: true });

      // Processar de forma assíncrona
      if (evento.payment) {
        const asaasPayment = getAsaasPaymentService();
        const eventoProcessado = await asaasPayment.processarWebhook(evento);

        // Buscar pagamento local
        const pagamentoLocal = await Pagamento.findByMpPaymentId(evento.payment.id);

        if (!pagamentoLocal) {
          console.log('⚠️  Pagamento não encontrado no banco local:', evento.payment.id);
          return;
        }

        // Atualizar status
        const statusMapeado = asaasPayment.mapearStatus(evento.payment.status);
        await Pagamento.update(pagamentoLocal.id, {
          status: statusMapeado === 'aprovado' ? 'approved' : evento.payment.status,
          data_pagamento: evento.payment.paymentDate
        });

        // Se pagamento foi confirmado/recebido
        if (evento.payment.status === 'RECEIVED' || evento.payment.status === 'CONFIRMED') {
          console.log('✅ Pagamento confirmado! Processando split e repasse...');
          await AsaasPaymentController.processarPagamentoAprovado(pagamentoLocal, evento.payment);
        }

        // Se pagamento foi cancelado/estornado
        if (evento.payment.status === 'REFUNDED' || evento.payment.status === 'DELETED') {
          console.log('🚫 Pagamento cancelado/estornado');
          if (pagamentoLocal.agendamento_id) {
            await Agendamento.update(pagamentoLocal.agendamento_id, {
              status: 'cancelado',
              status_pagamento: 'estornado'
            });
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      // Não retorna erro para Asaas não reenviar
    }
  }

  /**
   * Processa pagamento aprovado: split + repasse
   */
  static async processarPagamentoAprovado(pagamento, dadosPagamento) {
    try {
      await Pagamento.update(pagamento.id, {
        status: 'approved',
        data_pagamento: dadosPagamento.paymentDate || new Date().toISOString()
      });

      if (pagamento.agendamento_id) {
        await Agendamento.update(pagamento.agendamento_id, {
          status: 'confirmado',
          status_pagamento: 'aprovado'
        });
        console.log('✅ Agendamento confirmado (Asaas):', pagamento.agendamento_id);
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento aprovado:', error);
    }
  }

  /**
   * Cancelar pagamento
   * DELETE /api/asaas/payment/:paymentId
   */
  static async cancelarPagamento(req, res) {
    try {
      const { paymentId } = req.params;

      const asaasPayment = getAsaasPaymentService();

      if (!asaasPayment.isReady()) {
        return res.status(500).json({
          error: 'Serviço de pagamento não configurado'
        });
      }

      const resultado = await asaasPayment.cancelarCobranca(paymentId);

      // Atualizar no banco local
      const pagamentoLocal = await Pagamento.findByMpPaymentId(paymentId);
      if (pagamentoLocal) {
        await Pagamento.update(pagamentoLocal.id, {
          status: 'cancelled'
        });
      }

      res.json({
        success: true,
        message: 'Pagamento cancelado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error);
      res.status(500).json({
        error: 'Erro ao cancelar pagamento',
        details: error.message
      });
    }
  }
}

module.exports = AsaasPaymentController;
