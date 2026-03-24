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
