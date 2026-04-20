/**
 * Templates de mensagens WhatsApp para notificacoes
 * Usa formatacao WhatsApp: *bold*, _italic_
 */

class MessageTemplates {
  /**
   * Lembrete antes do agendamento
   */
  static antes(agendamento, minutos) {
    const hora = agendamento.horario || agendamento.data_hora?.split('T')[1]?.substring(0, 5) || '';
    const valor = agendamento.valor
      ? `\n💰 *Valor:* R$ ${(agendamento.valor / 100).toFixed(2).replace('.', ',')}`
      : '';

    return [
      `⏰ *Lembrete - Vistoria em ${minutos} minutos*`,
      '',
      `👤 *Cliente:* ${agendamento.nome_cliente || agendamento.nome || 'N/A'}`,
      `🚗 *Placa:* ${agendamento.placa || 'N/A'}`,
      `🔧 *Servico:* ${agendamento.tipo_servico || agendamento.servico || 'Vistoria'}`,
      `🕐 *Horario:* ${hora}`,
      valor,
      '',
      `📋 _AgendaAqui Vistorias_`
    ].filter(l => l !== '').join('\n');
  }

  /**
   * Agendamento iniciando agora
   */
  static inicio(agendamento) {
    return [
      `🟢 *Agendamento iniciando agora!*`,
      '',
      `👤 *Cliente:* ${agendamento.nome_cliente || agendamento.nome || 'N/A'}`,
      `🚗 *Placa:* ${agendamento.placa || 'N/A'}`,
      `🔧 *Servico:* ${agendamento.tipo_servico || agendamento.servico || 'Vistoria'}`,
      `📞 *Telefone:* ${agendamento.telefone || 'N/A'}`,
      '',
      `📋 _AgendaAqui Vistorias_`
    ].join('\n');
  }

  /**
   * Resumo diario dos agendamentos
   */
  static resumoDiario(agendamentos, data) {
    const dataFormatada = data || new Date().toLocaleDateString('pt-BR');
    const total = agendamentos.length;

    if (total === 0) {
      return [
        `📊 *Resumo do dia - ${dataFormatada}*`,
        '',
        `Nenhum agendamento para hoje.`,
        '',
        `📋 _AgendaAqui Vistorias_`
      ].join('\n');
    }

    const lista = agendamentos.map((a, i) => {
      const hora = a.horario || a.data_hora?.split('T')[1]?.substring(0, 5) || '';
      return `${i + 1}. ${hora} - ${a.nome_cliente || a.nome || 'N/A'} | ${a.placa || ''} | ${a.tipo_servico || a.servico || 'Vistoria'}`;
    }).join('\n');

    return [
      `📊 *Resumo do dia - ${dataFormatada}*`,
      '',
      `📌 *${total} agendamento${total > 1 ? 's' : ''}:*`,
      '',
      lista,
      '',
      `📋 _AgendaAqui Vistorias_`
    ].join('\n');
  }

  /**
   * Helpers
   */
  static _dataHora(agendamento) {
    if (agendamento.data_hora) {
      const d = new Date(agendamento.data_hora);
      const data = d.toLocaleDateString('pt-BR', { timeZone: 'America/Campo_Grande' });
      const hora = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Campo_Grande', hour: '2-digit', minute: '2-digit' });
      return { data, hora };
    }
    return { data: agendamento.data || '', hora: agendamento.horario || '' };
  }

  static _valor(agendamento) {
    if (!agendamento.valor) return '';
    return `R$ ${(agendamento.valor / 100).toFixed(2).replace('.', ',')}`;
  }

  /**
   * Evento: agendamento criado, aguardando pagamento - para o CLIENTE
   */
  static agendamentoCriadoCliente(agendamento, empresaNome) {
    const { data, hora } = this._dataHora(agendamento);
    const valor = this._valor(agendamento);
    return [
      `📅 *Agendamento recebido!*`,
      '',
      `Ola ${agendamento.cliente_nome || ''}, recebemos seu agendamento em *${empresaNome || 'nossa empresa'}*.`,
      '',
      `🔖 *Protocolo:* ${agendamento.protocolo || 'N/A'}`,
      `📆 *Data:* ${data} as ${hora}`,
      `🚗 *Veiculo:* ${agendamento.veiculo_placa || ''} ${agendamento.veiculo_modelo ? '- ' + agendamento.veiculo_modelo : ''}`.trim(),
      valor ? `💰 *Valor:* ${valor}` : '',
      '',
      `⏳ _Seu agendamento esta aguardando a confirmacao do pagamento. Assim que confirmarmos, voce recebera uma nova mensagem._`,
      '',
      `📋 _AgendaAqui_`
    ].filter(l => l !== '').join('\n');
  }

  /**
   * Evento: agendamento criado - para o GERENTE
   */
  static agendamentoCriadoGerente(agendamento) {
    const { data, hora } = this._dataHora(agendamento);
    const valor = this._valor(agendamento);
    return [
      `🆕 *Novo agendamento recebido*`,
      '',
      `👤 *Cliente:* ${agendamento.cliente_nome || 'N/A'}`,
      `📞 *Telefone:* ${agendamento.cliente_telefone || 'N/A'}`,
      `🔖 *Protocolo:* ${agendamento.protocolo || 'N/A'}`,
      `📆 *Data:* ${data} as ${hora}`,
      `🚗 *Veiculo:* ${agendamento.veiculo_placa || ''} ${agendamento.veiculo_modelo ? '- ' + agendamento.veiculo_modelo : ''}`.trim(),
      valor ? `💰 *Valor:* ${valor}` : '',
      '',
      `⏳ _Status: aguardando pagamento. Acompanhe pelo painel._`,
      '',
      `📋 _AgendaAqui_`
    ].filter(l => l !== '').join('\n');
  }

  /**
   * Evento: pagamento aprovado - para o CLIENTE
   */
  static pagamentoAprovadoCliente(agendamento, empresaNome) {
    const { data, hora } = this._dataHora(agendamento);
    const valor = this._valor(agendamento);
    return [
      `✅ *Pagamento confirmado!*`,
      '',
      `Ola ${agendamento.cliente_nome || ''}, seu pagamento em *${empresaNome || 'nossa empresa'}* foi confirmado.`,
      '',
      `🔖 *Protocolo:* ${agendamento.protocolo || 'N/A'}`,
      `📆 *Data da vistoria:* ${data} as ${hora}`,
      `🚗 *Veiculo:* ${agendamento.veiculo_placa || ''} ${agendamento.veiculo_modelo ? '- ' + agendamento.veiculo_modelo : ''}`.trim(),
      valor ? `💰 *Valor pago:* ${valor}` : '',
      '',
      `📍 _Nos vemos na data marcada. Em caso de duvidas, responda esta mensagem._`,
      '',
      `📋 _AgendaAqui_`
    ].filter(l => l !== '').join('\n');
  }

  /**
   * Evento: pagamento aprovado - para o GERENTE
   */
  static pagamentoAprovadoGerente(agendamento) {
    const { data, hora } = this._dataHora(agendamento);
    const valor = this._valor(agendamento);
    return [
      `💚 *Pagamento aprovado*`,
      '',
      `👤 *Cliente:* ${agendamento.cliente_nome || 'N/A'}`,
      `📞 *Telefone:* ${agendamento.cliente_telefone || 'N/A'}`,
      `🔖 *Protocolo:* ${agendamento.protocolo || 'N/A'}`,
      `📆 *Vistoria em:* ${data} as ${hora}`,
      `🚗 *Veiculo:* ${agendamento.veiculo_placa || ''} ${agendamento.veiculo_modelo ? '- ' + agendamento.veiculo_modelo : ''}`.trim(),
      valor ? `💰 *Valor:* ${valor}` : '',
      '',
      `🟢 _Agendamento confirmado. Cliente ja foi notificado._`,
      '',
      `📋 _AgendaAqui_`
    ].filter(l => l !== '').join('\n');
  }

  /**
   * Evento: cliente enviou comprovante PIX manual - para o GERENTE
   * Enviado junto com o arquivo do comprovante.
   */
  static comprovanteEnviadoGerente(agendamento) {
    const { data, hora } = this._dataHora(agendamento);
    const valor = this._valor(agendamento);
    return [
      `📎 *Comprovante recebido*`,
      '',
      `👤 *Cliente:* ${agendamento.cliente_nome || 'N/A'}`,
      `📞 *Telefone:* ${agendamento.cliente_telefone || 'N/A'}`,
      `🔖 *Protocolo:* ${agendamento.protocolo || 'N/A'}`,
      `📆 *Vistoria em:* ${data} as ${hora}`,
      `🚗 *Veiculo:* ${agendamento.veiculo_placa || ''} ${agendamento.veiculo_modelo ? '- ' + agendamento.veiculo_modelo : ''}`.trim(),
      valor ? `💰 *Valor:* ${valor}` : '',
      '',
      `⏳ _Confirme o pagamento no painel para liberar o agendamento._`,
      '',
      `📋 _AgendaAqui_`
    ].filter(l => l !== '').join('\n');
  }

  /**
   * Mensagem de teste
   */
  static teste() {
    return [
      `✅ *Teste de notificacao WhatsApp*`,
      '',
      `Se voce recebeu esta mensagem, as notificacoes estao funcionando corretamente!`,
      '',
      `📋 _AgendaAqui Vistorias_`
    ].join('\n');
  }
}

module.exports = MessageTemplates;
