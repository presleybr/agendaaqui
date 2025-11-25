const Empresa = require('../models/Empresa');
const Configuracao = require('../models/Configuracao');
const Transacao = require('../models/Transacao');
const Pagamento = require('../models/Pagamento');

class SplitPaymentService {
  /**
   * Calcula a taxa que deve ser cobrada baseado no tempo de funcionamento da empresa
   * @param {number} empresaId - ID da empresa
   * @returns {Promise<number>} - Taxa em centavos
   */
  static async calcularTaxa(empresaId) {
    const diasFuncionamento = await Empresa.getDiasFuncionamento(empresaId);
    const diasTaxaInicial = parseInt(await Configuracao.get('dias_taxa_inicial') || '30');

    if (diasFuncionamento <= diasTaxaInicial) {
      // Primeiros 30 dias: R$ 5,00
      return parseInt(await Configuracao.get('taxa_inicial') || '500');
    } else {
      // Após 30 dias: R$ 7,00
      return parseInt(await Configuracao.get('taxa_apos_30_dias') || '700');
    }
  }

  /**
   * Processa o split de um pagamento
   * @param {number} pagamentoId - ID do pagamento aprovado
   * @returns {Promise<object>} - Resultado do split
   */
  static async processar(pagamentoId) {
    try {
      const pagamento = await Pagamento.findById(pagamentoId);

      if (!pagamento) {
        throw new Error('Pagamento não encontrado');
      }

      if (pagamento.status !== 'aprovado') {
        throw new Error('Apenas pagamentos aprovados podem ter split processado');
      }

      // Verificar se já foi processado
      if (pagamento.status_repasse === 'processado') {
        throw new Error('Split já foi processado para este pagamento');
      }

      const empresa = await Empresa.findById(pagamento.empresa_id);

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      // Calcular taxa
      const taxa = await this.calcularTaxa(empresa.id);
      const valorEmpresa = pagamento.valor - taxa;

      if (valorEmpresa < 0) {
        throw new Error('Valor do pagamento menor que a taxa');
      }

      // Atualizar pagamento com dados do split
      await Pagamento.update(pagamento.id, {
        valor_taxa: taxa,
        valor_empresa: valorEmpresa,
        status_repasse: 'pendente',
        split_data: JSON.stringify({
          taxa_percentual: ((taxa / pagamento.valor) * 100).toFixed(2),
          taxa_valor: taxa,
          empresa_valor: valorEmpresa,
          processado_em: new Date().toISOString()
        })
      });

      // Criar transação de taxa (receita do sistema)
      await Transacao.create({
        empresa_id: empresa.id,
        pagamento_id: pagamento.id,
        agendamento_id: pagamento.agendamento_id,
        tipo: 'taxa',
        valor: taxa,
        descricao: `Taxa de sistema - Pagamento #${pagamento.id}`,
        status: 'processado'
      });

      // Criar transação de repasse para empresa
      const transacaoRepasse = await Transacao.create({
        empresa_id: empresa.id,
        pagamento_id: pagamento.id,
        agendamento_id: pagamento.agendamento_id,
        tipo: 'repasse',
        valor: valorEmpresa,
        descricao: `Repasse - Pagamento #${pagamento.id}`,
        pix_key: empresa.pix_key,
        pix_status: 'pendente',
        status: 'pendente'
      });

      return {
        success: true,
        pagamento_id: pagamento.id,
        valor_total: pagamento.valor,
        taxa,
        valor_empresa: valorEmpresa,
        transacao_repasse_id: transacaoRepasse.id,
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          pix_key: empresa.pix_key,
          pix_type: empresa.pix_type
        }
      };
    } catch (error) {
      console.error('Erro ao processar split:', error);
      throw error;
    }
  }

  /**
   * Marca um repasse como processado/pago
   * @param {number} transacaoId - ID da transação de repasse
   * @param {object} data - Dados do PIX (txid, etc)
   */
  static async confirmarRepasse(transacaoId, data = {}) {
    try {
      const transacao = await Transacao.findById(transacaoId);

      if (!transacao) {
        throw new Error('Transação não encontrada');
      }

      if (transacao.tipo !== 'repasse') {
        throw new Error('Apenas transações de repasse podem ser confirmadas');
      }

      // Atualizar transação
      await Transacao.updateStatus(transacaoId, 'processado', {
        pix_status: 'pago',
        ...data
      });

      // Atualizar pagamento
      if (transacao.pagamento_id) {
        await Pagamento.update(transacao.pagamento_id, {
          status_repasse: 'processado',
          data_repasse: new Date().toISOString()
        });
      }

      return {
        success: true,
        transacao_id: transacaoId,
        message: 'Repasse confirmado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao confirmar repasse:', error);
      throw error;
    }
  }

  /**
   * Marca um repasse como erro/falha
   * @param {number} transacaoId - ID da transação de repasse
   * @param {string} erroMensagem - Mensagem de erro
   */
  static async marcarErroRepasse(transacaoId, erroMensagem) {
    try {
      await Transacao.updateStatus(transacaoId, 'erro', {
        pix_status: 'erro',
        erro_mensagem: erroMensagem
      });

      return {
        success: true,
        transacao_id: transacaoId,
        message: 'Erro registrado'
      };
    } catch (error) {
      console.error('Erro ao marcar erro no repasse:', error);
      throw error;
    }
  }

  /**
   * Processa todos os repasses pendentes
   * Esta função seria chamada por um cron job ou processo em background
   */
  static async processarRepassesPendentes() {
    try {
      // Buscar todos os pagamentos aprovados sem split processado
      const pagamentosPendentes = await Pagamento.findPendingSplits();

      const resultados = [];

      for (const pagamento of pagamentosPendentes) {
        try {
          const resultado = await this.processar(pagamento.id);
          resultados.push({ success: true, pagamento_id: pagamento.id, ...resultado });
        } catch (error) {
          resultados.push({
            success: false,
            pagamento_id: pagamento.id,
            error: error.message
          });
        }
      }

      return {
        total: pagamentosPendentes.length,
        resultados
      };
    } catch (error) {
      console.error('Erro ao processar repasses pendentes:', error);
      throw error;
    }
  }
}

module.exports = SplitPaymentService;
