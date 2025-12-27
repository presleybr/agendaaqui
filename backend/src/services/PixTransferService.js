const { getInstance: getAsaasService } = require('./AsaasService');

/**
 * Serviço para realizar transferências PIX automáticas
 * Agora integrado com a API da Asaas
 *
 * Fluxo:
 * 1. Cliente paga via Mercado Pago PIX
 * 2. Webhook confirma pagamento
 * 3. Sistema calcula split (taxa plataforma + valor empresa)
 * 4. Este serviço transfere valor da empresa via Asaas PIX
 */
class PixTransferService {
  constructor() {
    this.asaas = getAsaasService();
    this.initialized = this.asaas.isReady();

    if (!this.initialized) {
      console.warn('⚠️  PixTransferService: Asaas não configurado - modo simulação ativado');
    }
  }

  /**
   * Realizar transferência PIX via Asaas
   * @param {Object} dadosTransferencia - Dados da transferência
   * @param {string} dadosTransferencia.chave_pix - Chave PIX do destinatário
   * @param {number} dadosTransferencia.valor - Valor em CENTAVOS
   * @param {string} dadosTransferencia.empresa_nome - Nome da empresa
   * @param {number} dadosTransferencia.empresa_id - ID da empresa
   * @param {number} dadosTransferencia.split_id - ID do split
   */
  async transferirPix(dadosTransferencia) {
    const { chave_pix, valor, empresa_nome, empresa_id, split_id } = dadosTransferencia;

    console.log(`\n💸 PixTransferService: Iniciando transferência`);
    console.log(`   Para: ${empresa_nome} (${chave_pix})`);
    console.log(`   Valor: R$ ${(valor / 100).toFixed(2)}`);
    console.log(`   Split ID: ${split_id}`);

    // Se Asaas não está configurado, usar modo simulação
    if (!this.initialized) {
      console.log('⚠️  Modo SIMULAÇÃO - Asaas não configurado');
      return this.transferirPixSimulado(dadosTransferencia);
    }

    try {
      // Converter centavos para reais
      const valorReais = valor / 100;

      // Realizar transferência via Asaas
      const resultado = await this.asaas.transferirPix({
        valor: valorReais,
        chavePix: chave_pix,
        descricao: `Repasse Vistoria - ${empresa_nome} - Split #${split_id}`,
        empresaNome: empresa_nome,
        empresaId: empresa_id,
        splitId: split_id
      });

      if (resultado.sucesso) {
        return {
          sucesso: true,
          comprovante: resultado.transferenciaId,
          tipo: resultado.tipo,
          ambiente: resultado.ambiente,
          status: resultado.status,
          detalhes: {
            asaas_id: resultado.transferenciaId,
            valor: resultado.valor,
            chave_pix: resultado.chavePix,
            tipo_chave: resultado.tipoChave,
            data_transferencia: resultado.dataTransferencia,
            data_efetivacao: resultado.dataEfetivacao,
            comprovante_url: resultado.comprovante
          }
        };
      } else {
        return {
          sucesso: false,
          mensagem: resultado.mensagem,
          erro: resultado.detalhes
        };
      }

    } catch (error) {
      console.error('❌ Erro na transferência PIX:', error);
      return {
        sucesso: false,
        mensagem: error.message,
        erro: error
      };
    }
  }

  /**
   * Transferência PIX simulada (quando Asaas não está configurado)
   */
  transferirPixSimulado(dadosTransferencia) {
    const { chave_pix, valor, empresa_nome, split_id } = dadosTransferencia;

    console.log('📝 Gerando comprovante SIMULADO...');

    const comprovante = this.gerarComprovanteSimulado(valor, chave_pix);

    return {
      sucesso: true,
      comprovante,
      tipo: 'simulado',
      ambiente: 'desenvolvimento',
      status: 'PENDING_MANUAL',
      mensagem: 'Transferência registrada - MODO SIMULAÇÃO (configure ASAAS_API_KEY para produção)',
      detalhes: {
        chave_pix,
        valor: valor / 100,
        empresa_nome,
        split_id,
        timestamp: new Date().toISOString(),
        aviso: 'Esta é uma transferência simulada. Configure ASAAS_API_KEY para ativar transferências reais.'
      }
    };
  }

  /**
   * Verificar se uma transferência foi concluída
   * @param {string} transferenciaId - ID da transferência na Asaas
   */
  async verificarStatusTransferencia(transferenciaId) {
    if (!this.initialized) {
      return {
        status: 'simulado',
        comprovante_id: transferenciaId,
        mensagem: 'Modo simulação - status não disponível'
      };
    }

    try {
      const resultado = await this.asaas.consultarTransferencia(transferenciaId);

      return {
        status: resultado.status,
        comprovante_id: resultado.id,
        valor: resultado.valor,
        chave_pix: resultado.chavePix,
        data_conclusao: resultado.dataEfetivacao,
        comprovante_url: resultado.comprovante
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return null;
    }
  }

  /**
   * Consultar saldo disponível para transferências
   */
  async consultarSaldo() {
    if (!this.initialized) {
      return {
        disponivel: false,
        mensagem: 'Asaas não configurado'
      };
    }

    try {
      const { saldo, saldo_formatado } = await this.asaas.getSaldo();

      return {
        disponivel: true,
        saldo,
        saldo_formatado
      };
    } catch (error) {
      console.error('❌ Erro ao consultar saldo:', error);
      return {
        disponivel: false,
        mensagem: error.message
      };
    }
  }

  /**
   * Listar transferências realizadas
   */
  async listarTransferencias(filtros = {}) {
    if (!this.initialized) {
      return {
        total: 0,
        transferencias: [],
        mensagem: 'Asaas não configurado'
      };
    }

    try {
      return await this.asaas.listarTransferencias(filtros);
    } catch (error) {
      console.error('❌ Erro ao listar transferências:', error);
      return {
        total: 0,
        transferencias: [],
        erro: error.message
      };
    }
  }

  /**
   * Gerar comprovante simulado
   */
  gerarComprovanteSimulado(valor, chavePix) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `PIX-SIM-${timestamp}-${random}`;
  }

  /**
   * Validar chave PIX
   */
  validarChavePix(chave) {
    if (!chave) return false;

    // Usar validação da Asaas se disponível
    if (this.initialized) {
      const resultado = this.asaas.validarChavePix(chave);
      return resultado.valida;
    }

    // Validação local
    const chaveClean = chave.replace(/\s+/g, '').replace(/[^a-zA-Z0-9@.+-]/g, '');

    // CPF: 11 dígitos
    if (/^\d{11}$/.test(chaveClean)) return true;

    // CNPJ: 14 dígitos
    if (/^\d{14}$/.test(chaveClean)) return true;

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chaveClean)) return true;

    // Telefone: +5511999999999
    if (/^\+?\d{12,13}$/.test(chaveClean)) return true;

    // Chave aleatória (UUID)
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chaveClean)) return true;

    return false;
  }

  /**
   * Formatar valor para reais
   */
  formatarValor(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Verificar se o serviço está operacional
   */
  getStatus() {
    return {
      operacional: true,
      modo: this.initialized ? 'producao' : 'simulacao',
      asaas_configurado: this.initialized,
      ambiente: this.initialized ? (this.asaas.sandbox ? 'sandbox' : 'producao') : 'n/a'
    };
  }
}

module.exports = PixTransferService;
