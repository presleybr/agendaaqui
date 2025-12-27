/**
 * Serviço de Pagamentos via Asaas
 *
 * Funcionalidades:
 * - Criar cliente
 * - Criar cobrança PIX
 * - Consultar status de pagamento
 * - Split automático de pagamento
 * - Webhook de notificações
 *
 * Documentação: https://docs.asaas.com
 */

const axios = require('axios');
const { TAXA_PIX_ASAAS } = require('../config/taxas');

class AsaasPaymentService {
  constructor() {
    this.sandbox = process.env.ASAAS_SANDBOX === 'true';
    this.apiKey = process.env.ASAAS_API_KEY;

    this.baseUrl = this.sandbox
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    if (!this.apiKey) {
      console.warn('⚠️  ASAAS_API_KEY não configurada!');
      this.initialized = false;
    } else {
      this.initialized = true;
      console.log(`✅ AsaasPaymentService inicializado (${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      },
      timeout: 30000
    });

    // Interceptor para logs de erro
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('❌ Erro na API Asaas:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica se o serviço está pronto
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Busca ou cria um cliente na Asaas
   * @param {Object} dados - Dados do cliente
   * @param {string} dados.nome - Nome completo
   * @param {string} dados.cpf - CPF do cliente
   * @param {string} dados.email - Email (opcional)
   * @param {string} dados.telefone - Telefone (opcional)
   */
  async buscarOuCriarCliente(dados) {
    const { nome, cpf, email, telefone } = dados;

    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    // Limpar CPF
    const cpfLimpo = cpf.replace(/\D/g, '');

    try {
      // Buscar cliente existente pelo CPF
      const busca = await this.client.get('/customers', {
        params: { cpfCnpj: cpfLimpo }
      });

      if (busca.data.data && busca.data.data.length > 0) {
        console.log('👤 Cliente encontrado na Asaas:', busca.data.data[0].id);
        return busca.data.data[0];
      }

      // Criar novo cliente
      console.log('👤 Criando novo cliente na Asaas...');

      // Formatar telefone para o padrão Asaas (com DDD)
      let telefoneLimpo = null;
      if (telefone) {
        telefoneLimpo = telefone.replace(/\D/g, '');
        // Se tiver 11 dígitos (com DDD), está ok
        // Se tiver 10 ou 9, adicionar DDD padrão
        if (telefoneLimpo.length === 9) {
          telefoneLimpo = '11' + telefoneLimpo;
        } else if (telefoneLimpo.length === 10) {
          // Já tem DDD mas sem 9
          telefoneLimpo = telefoneLimpo.substring(0, 2) + '9' + telefoneLimpo.substring(2);
        }
      }

      const novoCliente = await this.client.post('/customers', {
        name: nome,
        cpfCnpj: cpfLimpo,
        email: email || undefined,
        phone: telefoneLimpo || undefined,
        notificationDisabled: false
      });

      console.log('✅ Cliente criado:', novoCliente.data.id);
      return novoCliente.data;

    } catch (error) {
      console.error('❌ Erro ao buscar/criar cliente:', error.response?.data || error.message);
      throw new Error(`Erro ao processar cliente: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Cria uma cobrança PIX
   * @param {Object} dados - Dados da cobrança
   * @param {string} dados.clienteAsaasId - ID do cliente na Asaas
   * @param {number} dados.valor - Valor em REAIS (ex: 151.99)
   * @param {string} dados.descricao - Descrição da cobrança
   * @param {string} dados.externalReference - Referência externa (agendamento_id)
   * @param {Object} dados.split - Dados do split (opcional)
   */
  async criarCobrancaPix(dados) {
    const { clienteAsaasId, valor, descricao, externalReference, split } = dados;

    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      // Data de vencimento (hoje + 1 dia)
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 1);

      const payload = {
        customer: clienteAsaasId,
        billingType: 'PIX',
        value: valor,
        dueDate: vencimento.toISOString().split('T')[0],
        description: descricao || 'Vistoria Veicular',
        externalReference: externalReference?.toString(),
        // Configurações do PIX
        postalService: false
      };

      // Adicionar split se configurado
      if (split && split.walletId) {
        payload.split = [{
          walletId: split.walletId,
          fixedValue: split.fixedValue, // Valor fixo para a carteira
          percentualValue: split.percentualValue // Ou percentual
        }];
      }

      console.log('💳 Criando cobrança PIX na Asaas...');
      console.log('   Valor:', `R$ ${valor.toFixed(2)}`);
      console.log('   Cliente:', clienteAsaasId);

      const response = await this.client.post('/payments', payload);

      console.log('✅ Cobrança criada:', response.data.id);

      // Buscar QR Code PIX
      const qrCode = await this.obterQrCodePix(response.data.id);

      return {
        sucesso: true,
        cobrancaId: response.data.id,
        status: response.data.status,
        valor: response.data.value,
        vencimento: response.data.dueDate,
        linkPagamento: response.data.invoiceUrl,
        pixCopiaECola: qrCode?.payload,
        pixQrCodeBase64: qrCode?.encodedImage,
        pixExpirationDate: qrCode?.expirationDate,
        detalhes: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao criar cobrança:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cobrança: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Obtém o QR Code PIX de uma cobrança
   * @param {string} cobrancaId - ID da cobrança
   */
  async obterQrCodePix(cobrancaId) {
    try {
      const response = await this.client.get(`/payments/${cobrancaId}/pixQrCode`);
      return response.data;
    } catch (error) {
      console.error('⚠️  Erro ao obter QR Code:', error.message);
      return null;
    }
  }

  /**
   * Consulta status de uma cobrança
   * @param {string} cobrancaId - ID da cobrança
   */
  async consultarCobranca(cobrancaId) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.get(`/payments/${cobrancaId}`);

      return {
        id: response.data.id,
        status: response.data.status,
        valor: response.data.value,
        valorPago: response.data.netValue,
        dataPagamento: response.data.paymentDate,
        dataConfirmacao: response.data.confirmedDate,
        formaPagamento: response.data.billingType,
        linkPagamento: response.data.invoiceUrl,
        externalReference: response.data.externalReference,
        detalhes: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao consultar cobrança:', error.message);
      throw new Error(`Erro ao consultar cobrança: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Consulta cobrança por referência externa (agendamento_id)
   * @param {string} externalReference - ID do agendamento
   */
  async consultarPorReferencia(externalReference) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.get('/payments', {
        params: { externalReference }
      });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao consultar por referência:', error.message);
      return null;
    }
  }

  /**
   * Cancela uma cobrança
   * @param {string} cobrancaId - ID da cobrança
   */
  async cancelarCobranca(cobrancaId) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.delete(`/payments/${cobrancaId}`);
      console.log('🚫 Cobrança cancelada:', cobrancaId);
      return { sucesso: true, detalhes: response.data };
    } catch (error) {
      console.error('❌ Erro ao cancelar cobrança:', error.message);
      throw new Error(`Erro ao cancelar: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Estorna um pagamento
   * @param {string} cobrancaId - ID da cobrança
   * @param {number} valor - Valor a estornar (opcional, estorna total se não informado)
   */
  async estornarPagamento(cobrancaId, valor = null) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const payload = valor ? { value: valor } : {};
      const response = await this.client.post(`/payments/${cobrancaId}/refund`, payload);
      console.log('↩️  Pagamento estornado:', cobrancaId);
      return { sucesso: true, detalhes: response.data };
    } catch (error) {
      console.error('❌ Erro ao estornar:', error.message);
      throw new Error(`Erro ao estornar: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Lista cobranças com filtros
   * @param {Object} filtros - Filtros de busca
   */
  async listarCobrancas(filtros = {}) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.get('/payments', { params: filtros });

      return {
        total: response.data.totalCount,
        cobrancas: response.data.data.map(c => ({
          id: c.id,
          status: c.status,
          valor: c.value,
          cliente: c.customer,
          vencimento: c.dueDate,
          dataPagamento: c.paymentDate,
          formaPagamento: c.billingType,
          referencia: c.externalReference
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao listar cobranças:', error.message);
      throw error;
    }
  }

  /**
   * Processa webhook de pagamento
   * @param {Object} evento - Evento recebido do webhook
   */
  async processarWebhook(evento) {
    console.log('📥 Webhook Asaas recebido:', evento.event);

    const eventosRelevantes = {
      'PAYMENT_CREATED': 'cobranca_criada',
      'PAYMENT_AWAITING_RISK_ANALYSIS': 'aguardando_analise',
      'PAYMENT_APPROVED_BY_RISK_ANALYSIS': 'aprovado_analise',
      'PAYMENT_REPROVED_BY_RISK_ANALYSIS': 'reprovado_analise',
      'PAYMENT_UPDATED': 'cobranca_atualizada',
      'PAYMENT_CONFIRMED': 'pagamento_confirmado',
      'PAYMENT_RECEIVED': 'pagamento_recebido',
      'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED': 'cartao_recusado',
      'PAYMENT_OVERDUE': 'vencido',
      'PAYMENT_DELETED': 'deletado',
      'PAYMENT_RESTORED': 'restaurado',
      'PAYMENT_REFUNDED': 'estornado',
      'PAYMENT_RECEIVED_IN_CASH_UNDONE': 'recebimento_desfeito',
      'PAYMENT_CHARGEBACK_REQUESTED': 'chargeback_solicitado',
      'PAYMENT_CHARGEBACK_DISPUTE': 'chargeback_disputa',
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL': 'aguardando_reversao',
      'PAYMENT_DUNNING_RECEIVED': 'negativacao_recebida',
      'PAYMENT_DUNNING_REQUESTED': 'negativacao_solicitada',
      'PAYMENT_BANK_SLIP_VIEWED': 'boleto_visualizado',
      'PAYMENT_CHECKOUT_VIEWED': 'checkout_visualizado'
    };

    const tipoEvento = eventosRelevantes[evento.event] || 'desconhecido';

    return {
      tipo: tipoEvento,
      evento: evento.event,
      cobrancaId: evento.payment?.id,
      status: evento.payment?.status,
      valor: evento.payment?.value,
      dataPagamento: evento.payment?.paymentDate,
      referencia: evento.payment?.externalReference,
      dados: evento.payment
    };
  }

  /**
   * Consulta saldo disponível
   */
  async consultarSaldo() {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.get('/finance/balance');
      return {
        saldo: response.data.balance,
        saldoFormatado: `R$ ${response.data.balance.toFixed(2)}`
      };
    } catch (error) {
      console.error('❌ Erro ao consultar saldo:', error.message);
      throw error;
    }
  }

  /**
   * Mapeamento de status Asaas para status interno
   */
  mapearStatus(statusAsaas) {
    const mapa = {
      'PENDING': 'pendente',
      'RECEIVED': 'aprovado',
      'CONFIRMED': 'aprovado',
      'OVERDUE': 'vencido',
      'REFUNDED': 'estornado',
      'RECEIVED_IN_CASH': 'aprovado',
      'REFUND_REQUESTED': 'estorno_solicitado',
      'REFUND_IN_PROGRESS': 'estorno_processando',
      'CHARGEBACK_REQUESTED': 'chargeback',
      'CHARGEBACK_DISPUTE': 'chargeback_disputa',
      'AWAITING_CHARGEBACK_REVERSAL': 'aguardando_reversao',
      'DUNNING_REQUESTED': 'negativacao',
      'DUNNING_RECEIVED': 'negativacao_recebida',
      'AWAITING_RISK_ANALYSIS': 'aguardando_analise'
    };

    return mapa[statusAsaas] || statusAsaas.toLowerCase();
  }
}

// Singleton
let instance = null;

module.exports = {
  AsaasPaymentService,
  getInstance: () => {
    if (!instance) {
      instance = new AsaasPaymentService();
    }
    return instance;
  }
};
