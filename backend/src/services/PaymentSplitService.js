const Empresa = require('../models/Empresa');

class PaymentSplitService {
  /**
   * Calcular split de pagamento
   * Regra: Primeiros 30 dias = R$ 5,00 para plataforma
   *        Após 30 dias = R$ 0,00 para plataforma (tudo para empresa)
   */
  static async calcularSplit(empresaId, valorTotal) {
    console.log(`💰 Calculando split para empresa ${empresaId}, valor: R$ ${valorTotal / 100}`);

    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    // Verificar se está nos primeiros 30 dias
    const dataInicio = new Date(empresa.data_inicio);
    const hoje = new Date();
    const diasDesdeInicio = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));

    let valorPlataforma = 0;
    let valorEmpresa = valorTotal;
    let motivo = '';

    if (diasDesdeInicio <= 30) {
      // Primeiros 30 dias: R$ 5,00 fixo para plataforma
      valorPlataforma = empresa.percentual_plataforma || 500; // 500 = R$ 5,00
      valorEmpresa = valorTotal - valorPlataforma;
      motivo = `Período promocional (dia ${diasDesdeInicio}/30)`;

      console.log(`✅ Split: R$ ${valorPlataforma / 100} plataforma + R$ ${valorEmpresa / 100} empresa (${motivo})`);
    } else {
      // Após 30 dias: 0% para plataforma
      valorPlataforma = 0;
      valorEmpresa = valorTotal;
      motivo = 'Período promocional encerrado (0% comissão)';

      // Atualizar empresa para zerar comissão (se ainda não foi feito)
      if (empresa.percentual_plataforma !== 0) {
        await Empresa.update(empresaId, { percentual_plataforma: 0 });
        console.log(`✅ Comissão zerada para empresa ${empresa.slug}`);
      }

      console.log(`✅ Split: R$ 0,00 plataforma + R$ ${valorEmpresa / 100} empresa (${motivo})`);
    }

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
   * Simular repasse PIX (para testes)
   * TODO: Integrar com API PIX real (Mercado Pago, PagSeguro, etc)
   */
  static async simularRepasse(split) {
    console.log(`\n🔄 SIMULANDO repasse PIX para ${split.empresa_nome}`);
    console.log(`   Chave PIX: ${split.chave_pix}`);
    console.log(`   Valor: R$ ${split.valor_empresa / 100}`);

    // Em produção, aqui você faria:
    // 1. Chamada à API PIX do Mercado Pago/PagSeguro
    // 2. Aguardar confirmação
    // 3. Retornar comprovante

    // Por enquanto, apenas simula sucesso
    return {
      sucesso: true,
      comprovante: `PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mensagem: 'Repasse PIX simulado com sucesso'
    };
  }

  /**
   * Processar todos os repasses pendentes (CRON job)
   */
  static async processarRepassesPendentes() {
    console.log('\n🚀 Iniciando processamento de repasses pendentes...');

    const splits = await this.listarRepassesPendentes();

    if (splits.length === 0) {
      console.log('✅ Nenhum repasse pendente');
      return;
    }

    for (const split of splits) {
      try {
        // Marcar como processando
        await this.iniciarRepasse(split.id);

        // Simular repasse (em produção, chamar API PIX real)
        const resultado = await this.simularRepasse(split);

        if (resultado.sucesso) {
          // Marcar como concluído
          await this.concluirRepasse(split.id, resultado.comprovante);
          console.log(`✅ Repasse ${split.id} concluído: ${resultado.comprovante}`);
        } else {
          // Marcar como erro
          await this.erroRepasse(split.id, resultado.mensagem);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar repasse ${split.id}:`, error);
        await this.erroRepasse(split.id, error.message);
      }
    }

    console.log('✅ Processamento de repasses finalizado\n');
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
