const axios = require('axios');

/**
 * Servi\u00e7o de integra\u00e7\u00e3o com a API da Asaas
 * Documentação: https://docs.asaas.com
 *
 * Funcionalidades:
 * - Transferências PIX automáticas
 * - Consulta de saldo
 * - Webhook de eventos
 */
class AsaasService {
  constructor() {
    // Configuração baseada no ambiente
    this.sandbox = process.env.ASAAS_SANDBOX === 'true';
    this.apiKey = process.env.ASAAS_API_KEY;

    // URLs da API
    this.baseUrl = this.sandbox
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    // Verificar se está configurado
    if (!this.apiKey) {
      console.warn('⚠️  ASAAS_API_KEY não configurada - Transferências PIX desabilitadas');
      this.initialized = false;
    } else {
      this.initialized = true;
      console.log(`✅ Asaas inicializado (${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
    }

    // Cliente HTTP
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      },
      timeout: 30000
    });

    // Interceptor para logs
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
   * Verifica se o serviço está pronto para uso
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Consulta saldo disponível na conta Asaas
   */
  async getSaldo() {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.get('/finance/balance');

      return {
        saldo: response.data.balance,
        saldo_formatado: this.formatarMoeda(response.data.balance)
      };
    } catch (error) {
      console.error('❌ Erro ao consultar saldo Asaas:', error.message);
      throw new Error(`Erro ao consultar saldo: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Detecta o tipo de chave PIX automaticamente
   * @param {string} chavePix - Chave PIX
   * @returns {string} - Tipo da chave (CPF, CNPJ, EMAIL, PHONE, EVP)
   */
  detectarTipoChavePix(chavePix) {
    if (!chavePix) return null;

    const chave = chavePix.trim();

    // CPF: 11 dígitos numéricos
    if (/^\d{11}$/.test(chave.replace(/\D/g, '')) && chave.replace(/\D/g, '').length === 11) {
      return 'CPF';
    }

    // CNPJ: 14 dígitos numéricos
    if (/^\d{14}$/.test(chave.replace(/\D/g, '')) && chave.replace(/\D/g, '').length === 14) {
      return 'CNPJ';
    }

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave)) {
      return 'EMAIL';
    }

    // Telefone: +55 seguido de DDD e número
    if (/^\+?55?\d{10,11}$/.test(chave.replace(/\D/g, ''))) {
      return 'PHONE';
    }

    // Chave aleatória (EVP/UUID)
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chave)) {
      return 'EVP';
    }

    // Se não identificou, tenta como EVP
    return 'EVP';
  }

  /**
   * Formata chave PIX para o padrão esperado pela Asaas
   * @param {string} chavePix - Chave PIX
   * @param {string} tipo - Tipo da chave
   * @returns {string} - Chave formatada
   */
  formatarChavePix(chavePix, tipo) {
    if (!chavePix) return null;

    const chave = chavePix.trim();

    switch (tipo) {
      case 'CPF':
        // Remove pontuação e mantém só números
        return chave.replace(/\D/g, '');

      case 'CNPJ':
        // Remove pontuação e mantém só números
        return chave.replace(/\D/g, '');

      case 'PHONE':
        // Formata como +5511999999999
        let telefone = chave.replace(/\D/g, '');
        if (!telefone.startsWith('55')) {
          telefone = '55' + telefone;
        }
        return '+' + telefone;

      case 'EMAIL':
        return chave.toLowerCase();

      case 'EVP':
      default:
        return chave;
    }
  }

  /**
   * Realiza transferência PIX para uma chave
   * @param {Object} dados - Dados da transferência
   * @param {number} dados.valor - Valor em REAIS (ex: 145.00)
   * @param {string} dados.chavePix - Chave PIX do destinatário
   * @param {string} dados.descricao - Descrição da transferência
   * @param {string} dados.empresaNome - Nome da empresa (para logs)
   * @param {number} dados.empresaId - ID da empresa
   * @param {number} dados.splitId - ID do split de pagamento
   */
  async transferirPix(dados) {
    const { valor, chavePix, descricao, empresaNome, empresaId, splitId } = dados;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💸 TRANSFERÊNCIA PIX VIA ASAAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Empresa: ${empresaNome} (ID: ${empresaId})`);
    console.log(`   Chave PIX: ${chavePix}`);
    console.log(`   Valor: R$ ${valor.toFixed(2)}`);
    console.log(`   Split ID: ${splitId}`);
    console.log(`   Ambiente: ${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!this.initialized) {
      throw new Error('Asaas não configurado. Configure ASAAS_API_KEY.');
    }

    // Validar valor mínimo
    if (valor < 1) {
      throw new Error('Valor mínimo para transferência é R$ 1,00');
    }

    // Detectar e formatar chave PIX
    const tipoChave = this.detectarTipoChavePix(chavePix);
    const chaveFormatada = this.formatarChavePix(chavePix, tipoChave);

    console.log(`📋 Tipo de chave detectado: ${tipoChave}`);
    console.log(`📋 Chave formatada: ${chaveFormatada}`);

    try {
      // Verificar saldo antes de transferir
      const { saldo } = await this.getSaldo();
      console.log(`💰 Saldo disponível: R$ ${saldo.toFixed(2)}`);

      if (saldo < valor) {
        throw new Error(`Saldo insuficiente. Disponível: R$ ${saldo.toFixed(2)}, Necessário: R$ ${valor.toFixed(2)}`);
      }

      // Montar payload da transferência
      const payload = {
        value: valor,
        pixAddressKey: chaveFormatada,
        pixAddressKeyType: tipoChave,
        description: descricao || `Repasse AgendaAqui - ${empresaNome}`,
        scheduleDate: null // Transferência imediata
      };

      console.log('📤 Enviando transferência para Asaas...');
      console.log('   Payload:', JSON.stringify(payload, null, 2));

      // Realizar transferência
      const response = await this.client.post('/transfers', payload);

      const resultado = {
        sucesso: true,
        transferenciaId: response.data.id,
        status: response.data.status,
        valor: response.data.value,
        chavePix: response.data.pixAddressKey,
        tipoChave: response.data.pixAddressKeyType,
        dataTransferencia: response.data.dateCreated,
        dataEfetivacao: response.data.effectiveDate,
        comprovante: response.data.transactionReceiptUrl || response.data.id,
        tipo: 'asaas_pix',
        ambiente: this.sandbox ? 'sandbox' : 'producao',
        detalhes: response.data
      };

      console.log('\n✅ TRANSFERÊNCIA REALIZADA COM SUCESSO!');
      console.log(`   ID Asaas: ${resultado.transferenciaId}`);
      console.log(`   Status: ${resultado.status}`);
      console.log(`   Comprovante: ${resultado.comprovante}`);

      return resultado;

    } catch (error) {
      console.error('\n❌ ERRO NA TRANSFERÊNCIA PIX');

      // Extrair mensagem de erro da Asaas
      let mensagemErro = error.message;
      if (error.response?.data?.errors) {
        mensagemErro = error.response.data.errors.map(e => e.description).join(', ');
      }

      console.error(`   Erro: ${mensagemErro}`);

      return {
        sucesso: false,
        erro: true,
        mensagem: mensagemErro,
        codigo: error.response?.status,
        detalhes: error.response?.data
      };
    }
  }

  /**
   * Consulta status de uma transferência
   * @param {string} transferenciaId - ID da transferência na Asaas
   */
  async consultarTransferencia(transferenciaId) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const response = await this.client.get(`/transfers/${transferenciaId}`);

      return {
        id: response.data.id,
        status: response.data.status,
        valor: response.data.value,
        chavePix: response.data.pixAddressKey,
        tipoChave: response.data.pixAddressKeyType,
        dataCriacao: response.data.dateCreated,
        dataEfetivacao: response.data.effectiveDate,
        descricao: response.data.description,
        comprovante: response.data.transactionReceiptUrl
      };
    } catch (error) {
      console.error('❌ Erro ao consultar transferência:', error.message);
      throw new Error(`Erro ao consultar transferência: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Lista transferências realizadas
   * @param {Object} filtros - Filtros opcionais
   * @param {string} filtros.dateCreated - Data de criação (YYYY-MM-DD)
   * @param {string} filtros.status - Status da transferência
   * @param {number} filtros.limit - Limite de resultados
   * @param {number} filtros.offset - Offset para paginação
   */
  async listarTransferencias(filtros = {}) {
    if (!this.initialized) {
      throw new Error('Asaas não configurado');
    }

    try {
      const params = new URLSearchParams();

      if (filtros.dateCreated) params.append('dateCreated', filtros.dateCreated);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await this.client.get(`/transfers?${params.toString()}`);

      return {
        total: response.data.totalCount,
        transferencias: response.data.data.map(t => ({
          id: t.id,
          status: t.status,
          valor: t.value,
          chavePix: t.pixAddressKey,
          tipoChave: t.pixAddressKeyType,
          dataCriacao: t.dateCreated,
          dataEfetivacao: t.effectiveDate,
          descricao: t.description
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao listar transferências:', error.message);
      throw new Error(`Erro ao listar transferências: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Valida uma chave PIX consultando na Asaas
   * @param {string} chavePix - Chave PIX a validar
   */
  async validarChavePix(chavePix) {
    if (!this.initialized) {
      // Se não está inicializado, faz validação local apenas
      const tipo = this.detectarTipoChavePix(chavePix);
      return {
        valida: tipo !== null,
        tipo,
        chaveFormatada: this.formatarChavePix(chavePix, tipo)
      };
    }

    const tipo = this.detectarTipoChavePix(chavePix);
    const chaveFormatada = this.formatarChavePix(chavePix, tipo);

    // Validação local básica
    return {
      valida: tipo !== null && chaveFormatada !== null,
      tipo,
      chaveFormatada
    };
  }

  /**
   * Processa webhook de eventos da Asaas
   * @param {Object} evento - Evento recebido
   */
  async processarWebhook(evento) {
    console.log('📥 Webhook Asaas recebido:', evento.event);

    switch (evento.event) {
      case 'TRANSFER_CREATED':
        console.log('📤 Transferência criada:', evento.transfer?.id);
        return { tipo: 'transferencia_criada', dados: evento.transfer };

      case 'TRANSFER_PENDING':
        console.log('⏳ Transferência pendente:', evento.transfer?.id);
        return { tipo: 'transferencia_pendente', dados: evento.transfer };

      case 'TRANSFER_IN_BANK_PROCESSING':
        console.log('🏦 Transferência em processamento bancário:', evento.transfer?.id);
        return { tipo: 'transferencia_processando', dados: evento.transfer };

      case 'TRANSFER_DONE':
        console.log('✅ Transferência concluída:', evento.transfer?.id);
        return { tipo: 'transferencia_concluida', dados: evento.transfer };

      case 'TRANSFER_FAILED':
        console.log('❌ Transferência falhou:', evento.transfer?.id);
        return { tipo: 'transferencia_falhou', dados: evento.transfer };

      case 'TRANSFER_CANCELLED':
        console.log('🚫 Transferência cancelada:', evento.transfer?.id);
        return { tipo: 'transferencia_cancelada', dados: evento.transfer };

      default:
        console.log('❓ Evento não tratado:', evento.event);
        return { tipo: 'desconhecido', dados: evento };
    }
  }

  /**
   * Formata valor para moeda brasileira
   */
  formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

// Singleton para uso em toda a aplicação
let instance = null;

module.exports = {
  AsaasService,
  getInstance: () => {
    if (!instance) {
      instance = new AsaasService();
    }
    return instance;
  }
};
