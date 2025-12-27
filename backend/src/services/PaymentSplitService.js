const Empresa = require('../models/Empresa');
const PixTransferService = require('./PixTransferService');

class PaymentSplitService {
  /**
   * Calcular split de pagamento
   * Regra: SEMPRE R$ 5,00 fixo para plataforma em cada transação
   */
  static async calcularSplit(empresaId, valorTotal) {
    console.log(`💰 Calculando split para empresa ${empresaId}, valor: R$ ${valorTotal / 100}`);

    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    // Verificar dias desde início (para informação)
    const dataInicio = new Date(empresa.data_inicio || empresa.created_at);
    const hoje = new Date();
    const diasDesdeInicio = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));

    // SEMPRE R$ 10,00 fixo para plataforma
    const valorPlataforma = empresa.percentual_plataforma || 1000; // 1000 = R$ 10,00
    const valorEmpresa = valorTotal - valorPlataforma;
    const motivo = 'Comissão fixa de R$ 10,00 por transação';

    // Validar que o valor total é suficiente
    if (valorTotal < valorPlataforma) {
      console.warn(`⚠️  Valor total (R$ ${valorTotal / 100}) é menor que a comissão (R$ ${valorPlataforma / 100})`);
    }

    console.log(`✅ Split: R$ ${valorPlataforma / 100} plataforma + R$ ${valorEmpresa / 100} empresa (${motivo})`);
    console.log(`   Empresa ativa há ${diasDesdeInicio} dias`);

    return {
      valor_total: valorTotal,
      valor_plataforma: valorPlataforma,
      valor_empresa: valorEmpresa,
      percentual_plataforma: empresa.percentual_plataforma,
      dias_desde_inicio: diasDesdeInicio,
      motivo,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        slug: empresa.slug,
        chave_pix: empresa.chave_pix
      }
    };
  }

  /**
   * Registrar split no banco de dados
   */
  static async registrarSplit(pagamentoId, empresaId, split) {
    console.log(`📝 Registrando split no banco: Pagamento ${pagamentoId}`);

    await Empresa.registrarSplit(pagamentoId, empresaId, {
      valor_total: split.valor_total,
      valor_plataforma: split.valor_plataforma,
      valor_empresa: split.valor_empresa
    });

    // Atualizar métricas da empresa
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    await Empresa.updateMetricas(empresaId, mes, ano, {
      total_agendamentos: 1,
      total_receita: split.valor_total,
      total_comissao_plataforma: split.valor_plataforma,
      total_repasses: 0 // Será atualizado quando o repasse for feito
    });

    console.log(`✅ Split registrado e métricas atualizadas`);
  }

  /**
   * Processar pagamento completo (calcular + registrar)
   */
  static async processarPagamento(pagamentoId, empresaId, valorTotal) {
    console.log(`\n🔄 Processando pagamento ${pagamentoId} para empresa ${empresaId}`);

    try {
      // 1. Calcular split
      const split = await this.calcularSplit(empresaId, valorTotal);

      // 2. Registrar no banco
      await this.registrarSplit(pagamentoId, empresaId, split);

      // 3. Retornar informações do split
      return split;
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      throw error;
    }
  }

  /**
   * Listar repasses pendentes
   */
  static async listarRepassesPendentes() {
    console.log('📋 Listando repasses pendentes...');

    const splits = await Empresa.getSplitsPendentes();

    console.log(`📊 ${splits.length} repasses pendentes`);

    return splits;
  }

  /**
   * Marcar repasse como processando
   */
  static async iniciarRepasse(splitId) {
    console.log(`⏳ Iniciando repasse ${splitId}...`);

    await Empresa.atualizarRepasse(splitId, 'processando');
  }

  /**
   * Marcar repasse como concluído
   */
  static async concluirRepasse(splitId, comprovante) {
    console.log(`✅ Repasse ${splitId} concluído`);

    await Empresa.atualizarRepasse(splitId, 'concluido', comprovante);

    // Atualizar métrica de repasses
    // TODO: Implementar lógica para atualizar total_repasses nas métricas
  }

  /**
   * Marcar repasse como erro
   */
  static async erroRepasse(splitId, mensagemErro) {
    console.error(`❌ Erro no repasse ${splitId}:`, mensagemErro);

    await Empresa.atualizarRepasse(splitId, 'erro', null, mensagemErro);
  }

  /**
   * Processar repasse PIX para empresa
   */
  static async processarRepasse(split) {
    console.log(`\n🔄 Processando repasse PIX para ${split.empresa_nome}`);
    console.log(`   Chave PIX: ${split.chave_pix}`);
    console.log(`   Valor: R$ ${split.valor_empresa / 100}`);

    try {
      const pixService = new PixTransferService();

      // Validar chave PIX
      if (!pixService.validarChavePix(split.chave_pix)) {
        throw new Error(`Chave PIX inválida: ${split.chave_pix}`);
      }

      // Realizar transferência
      const resultado = await pixService.transferirPix({
        chave_pix: split.chave_pix,
        valor: split.valor_empresa,
        empresa_nome: split.empresa_nome,
        empresa_id: split.empresa_id,
        split_id: split.id
      });

      return resultado;

    } catch (error) {
      console.error('❌ Erro ao processar repasse:', error);
      return {
        sucesso: false,
        mensagem: error.message,
        erro: error
      };
    }
  }

  /**
   * Processar todos os repasses pendentes (CRON job ou chamada manual)
   */
  static async processarRepassesPendentes() {
    console.log('\n🚀 Iniciando processamento de repasses pendentes...');

    const splits = await this.listarRepassesPendentes();

    if (splits.length === 0) {
      console.log('✅ Nenhum repasse pendente');
      return {
        total: 0,
        processados: 0,
        sucesso: 0,
        erros: 0
      };
    }

    let processados = 0;
    let sucesso = 0;
    let erros = 0;

    for (const split of splits) {
      try {
        console.log(`\n📌 Processando split #${split.id}...`);

        // Marcar como processando
        await this.iniciarRepasse(split.id);

        // Processar repasse PIX
        const resultado = await this.processarRepasse(split);

        if (resultado.sucesso) {
          // Marcar como concluído
          await this.concluirRepasse(split.id, resultado.comprovante);
          console.log(`✅ Repasse ${split.id} concluído: ${resultado.comprovante}`);
          sucesso++;
        } else {
          // Marcar como erro
          await this.erroRepasse(split.id, resultado.mensagem);
          console.log(`❌ Repasse ${split.id} falhou: ${resultado.mensagem}`);
          erros++;
        }

        processados++;
      } catch (error) {
        console.error(`❌ Erro ao processar repasse ${split.id}:`, error);
        await this.erroRepasse(split.id, error.message);
        erros++;
        processados++;
      }
    }

    const resumo = {
      total: splits.length,
      processados,
      sucesso,
      erros
    };

    console.log('\n✅ Processamento de repasses finalizado');
    console.log(`   Total: ${resumo.total}`);
    console.log(`   Sucesso: ${resumo.sucesso}`);
    console.log(`   Erros: ${resumo.erros}\n`);

    return resumo;
  }

  /**
   * Obter resumo de splits para uma empresa
   */
  static async obterResumoEmpresa(empresaId) {
    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    // Buscar métricas do mês atual
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    const metricas = await Empresa.getMetricas(empresaId, mes, ano);

    return {
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        slug: empresa.slug,
        data_inicio: empresa.data_inicio
      },
      metricas: metricas || {
        total_agendamentos: 0,
        total_receita: 0,
        total_comissao_plataforma: 0,
        total_repasses: 0
      },
      dias_desde_inicio: Math.floor(
        (new Date() - new Date(empresa.data_inicio)) / (1000 * 60 * 60 * 24)
      ),
      comissao_atual: empresa.percentual_plataforma
    };
  }
}

module.exports = PaymentSplitService;
