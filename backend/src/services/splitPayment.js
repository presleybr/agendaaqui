const Empresa = require('../models/Empresa');
const Configuracao = require('../models/Configuracao');
const Transacao = require('../models/Transacao');
const Pagamento = require('../models/Pagamento');

class SplitPaymentService {
  /**
   * Calcula a taxa que deve ser cobrada baseado na configuração da empresa
   * @param {object} empresa - Objeto da empresa
   * @returns {number} - Taxa em centavos
   */
  static calcularTaxa(empresa) {
    // Usa a taxa configurada na empresa (percentual_plataforma)
    // Padrão: 500 centavos = R$ 5,00
    const taxaEmpresa = empresa.percentual_plataforma || 500;

    console.log(`💰 Taxa da empresa "${empresa.nome}": R$ ${(taxaEmpresa / 100).toFixed(2)}`);

    return taxaEmpresa;
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

      // Aceita status 'approved' (MP) ou 'aprovado' (interno)
      if (pagamento.status !== 'approved' && pagamento.status !== 'aprovado') {
        throw new Error(`Apenas pagamentos aprovados podem ter split processado. Status atual: ${pagamento.status}`);
      }

      // Verificar se já foi processado
      if (pagamento.status_repasse === 'processado') {
        throw new Error('Split já foi processado para este pagamento');
      }

      const empresa = await Empresa.findById(pagamento.empresa_id);

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      // Calcular taxa usando a configuração da empresa
      const taxa = this.calcularTaxa(empresa);

      // Usar valor_total (em centavos) do pagamento
      const valorTotal = pagamento.valor_total || pagamento.valor || 0;
      const valorEmpresa = valorTotal - taxa;

      if (valorEmpresa < 0) {
        throw new Error(`Valor do pagamento (R$ ${(valorTotal/100).toFixed(2)}) menor que a taxa (R$ ${(taxa/100).toFixed(2)})`);
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`💰 REGISTRANDO SPLIT DE PAGAMENTO`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Pagamento ID: ${pagamento.id}`);
      console.log(`   Empresa: ${empresa.nome} (ID: ${empresa.id})`);
      console.log(`   Valor Total: R$ ${(valorTotal / 100).toFixed(2)}`);
      console.log(`   Taxa Plataforma: R$ ${(taxa / 100).toFixed(2)}`);
      console.log(`   Valor Empresa: R$ ${(valorEmpresa / 100).toFixed(2)}`);
      console.log(`   Chave PIX: ${empresa.chave_pix || empresa.pix_key || 'Não configurada'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Atualizar pagamento com dados do split
      await Pagamento.update(pagamento.id, {
        valor_taxa: taxa,
        valor_empresa: valorEmpresa,
        status_repasse: 'pendente',
        split_data: JSON.stringify({
          taxa_percentual: ((taxa / valorTotal) * 100).toFixed(2),
          taxa_valor: taxa,
          empresa_valor: valorEmpresa,
          empresa_nome: empresa.nome,
          empresa_pix: empresa.chave_pix || empresa.pix_key,
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
        descricao: `Repasse - Pagamento #${pagamento.id} - ${empresa.nome}`,
        pix_key: empresa.chave_pix || empresa.pix_key,
        pix_status: 'pendente',
        status: 'pendente'
      });

      return {
        success: true,
        pagamento_id: pagamento.id,
        valor_total: valorTotal,
        taxa,
        valor_empresa: valorEmpresa,
        transacao_repasse_id: transacaoRepasse.id,
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          pix_key: empresa.chave_pix || empresa.pix_key,
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
