/**
 * NotificationScheduler - Verifica e envia notificacoes WhatsApp
 * Chamado periodicamente via cron externo (a cada 5 minutos)
 */

const db = require('../config/database');
const whatsAppManager = require('./WhatsAppService');
const MessageTemplates = require('./MessageTemplates');

class NotificationScheduler {
  /**
   * Verifica e envia todas as notificacoes pendentes
   * Retorna resumo das acoes tomadas
   */
  static async checkAndSend() {
    const results = { antes: 0, inicio: 0, resumo: 0, erros: 0 };

    try {
      // Busca empresas com WhatsApp ativo e conectado
      const empresas = await db.query(`
        SELECT wc.empresa_id, wc.telefone_gerente,
               wc.notif_antes_ativo, wc.notif_antes_minutos,
               wc.notif_inicio_ativo,
               wc.notif_resumo_diario_ativo, wc.notif_resumo_horario
        FROM whatsapp_config wc
        WHERE wc.ativo = true
          AND wc.connection_status = 'connected'
          AND wc.telefone_gerente IS NOT NULL
          AND wc.telefone_gerente != ''
      `);

      for (const empresa of empresas.rows) {
        try {
          // Verifica se esta conectado na memoria
          if (!whatsAppManager.isConnected(empresa.empresa_id)) {
            continue;
          }

          // 1. Notificacao "antes" do agendamento
          if (empresa.notif_antes_ativo) {
            const r = await this.checkNotifAntes(empresa);
            results.antes += r;
          }

          // 2. Notificacao de inicio
          if (empresa.notif_inicio_ativo) {
            const r = await this.checkNotifInicio(empresa);
            results.inicio += r;
          }

          // 3. Resumo diario
          if (empresa.notif_resumo_diario_ativo) {
            const r = await this.checkResumoDiario(empresa);
            results.resumo += r;
          }
        } catch (err) {
          console.error(`[NotifScheduler] Erro empresa ${empresa.empresa_id}:`, err.message);
          results.erros++;
        }
      }
    } catch (err) {
      console.error('[NotifScheduler] Erro geral:', err.message);
      results.erros++;
    }

    return results;
  }

  /**
   * Verifica agendamentos que estao a X minutos de comecar
   * Janela de 5 minutos para nao perder nenhum
   */
  static async checkNotifAntes(empresa) {
    const minutos = empresa.notif_antes_minutos || 30;
    let enviados = 0;

    // Busca agendamentos daqui a ~X minutos (janela de 5min)
    const agendamentos = await db.query(`
      SELECT a.id, a.data_hora, a.valor, a.tipo_servico,
             c.nome as nome_cliente, c.telefone, v.placa
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1
        AND a.status IN ('pendente', 'confirmado')
        AND a.data_hora >= NOW() + INTERVAL '${minutos - 2} minutes'
        AND a.data_hora <= NOW() + INTERVAL '${minutos + 3} minutes'
    `, [empresa.empresa_id]);

    for (const ag of agendamentos.rows) {
      // Verifica se ja enviou
      const jaEnviou = await this.jaEnviou(empresa.empresa_id, ag.id, 'antes');
      if (jaEnviou) continue;

      const msg = MessageTemplates.antes(ag, minutos);
      await this.enviarELogar(empresa, ag.id, 'antes', msg);
      enviados++;
    }

    return enviados;
  }

  /**
   * Verifica agendamentos iniciando agora (janela de 5min)
   */
  static async checkNotifInicio(empresa) {
    let enviados = 0;

    const agendamentos = await db.query(`
      SELECT a.id, a.data_hora, a.valor, a.tipo_servico,
             c.nome as nome_cliente, c.telefone, v.placa
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1
        AND a.status IN ('pendente', 'confirmado')
        AND a.data_hora >= NOW() - INTERVAL '2 minutes'
        AND a.data_hora <= NOW() + INTERVAL '3 minutes'
    `, [empresa.empresa_id]);

    for (const ag of agendamentos.rows) {
      const jaEnviou = await this.jaEnviou(empresa.empresa_id, ag.id, 'inicio');
      if (jaEnviou) continue;

      const msg = MessageTemplates.inicio(ag);
      await this.enviarELogar(empresa, ag.id, 'inicio', msg);
      enviados++;
    }

    return enviados;
  }

  /**
   * Envia resumo diario se estiver no horario configurado
   */
  static async checkResumoDiario(empresa) {
    const horarioConfig = empresa.notif_resumo_horario || '07:00';
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    // Verifica se esta dentro da janela de 5min do horario configurado
    const [hConfig, mConfig] = horarioConfig.split(':').map(Number);
    const [hAtual, mAtual] = horaAtual.split(':').map(Number);
    const diffMin = (hAtual * 60 + mAtual) - (hConfig * 60 + mConfig);

    if (diffMin < 0 || diffMin >= 5) return 0;

    // Verifica se ja enviou resumo hoje
    const jaEnviou = await this.jaEnviou(empresa.empresa_id, null, 'resumo_diario');
    if (jaEnviou) return 0;

    // Busca agendamentos do dia
    const agendamentos = await db.query(`
      SELECT a.id, a.data_hora, a.valor, a.tipo_servico,
             c.nome as nome_cliente, c.telefone, v.placa
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1
        AND DATE(a.data_hora) = CURRENT_DATE
        AND a.status IN ('pendente', 'confirmado')
      ORDER BY a.data_hora
    `, [empresa.empresa_id]);

    const dataHoje = agora.toLocaleDateString('pt-BR');
    const msg = MessageTemplates.resumoDiario(agendamentos.rows, dataHoje);
    await this.enviarELogar(empresa, null, 'resumo_diario', msg);

    return 1;
  }

  /**
   * Verifica se notificacao ja foi enviada (evita duplicatas)
   */
  static async jaEnviou(empresaId, agendamentoId, tipo) {
    let query, params;

    if (tipo === 'resumo_diario') {
      // Para resumo diario, verifica se ja enviou hoje
      query = `
        SELECT id FROM whatsapp_notificacoes_log
        WHERE empresa_id = $1 AND tipo = $2 AND DATE(created_at) = CURRENT_DATE AND status = 'enviado'
        LIMIT 1
      `;
      params = [empresaId, tipo];
    } else {
      query = `
        SELECT id FROM whatsapp_notificacoes_log
        WHERE empresa_id = $1 AND agendamento_id = $2 AND tipo = $3 AND status = 'enviado'
        LIMIT 1
      `;
      params = [empresaId, agendamentoId, tipo];
    }

    const result = await db.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Envia mensagem e loga resultado
   */
  static async enviarELogar(empresa, agendamentoId, tipo, mensagem) {
    try {
      await whatsAppManager.sendMessage(empresa.empresa_id, empresa.telefone_gerente, mensagem);

      await db.query(`
        INSERT INTO whatsapp_notificacoes_log (empresa_id, agendamento_id, tipo, telefone_destino, mensagem, status)
        VALUES ($1, $2, $3, $4, $5, 'enviado')
      `, [empresa.empresa_id, agendamentoId, tipo, empresa.telefone_gerente, mensagem]);
    } catch (err) {
      console.error(`[NotifScheduler] Erro ao enviar ${tipo} empresa ${empresa.empresa_id}:`, err.message);

      await db.query(`
        INSERT INTO whatsapp_notificacoes_log (empresa_id, agendamento_id, tipo, telefone_destino, mensagem, status, erro_detalhes)
        VALUES ($1, $2, $3, $4, $5, 'erro', $6)
      `, [empresa.empresa_id, agendamentoId, tipo, empresa.telefone_gerente, mensagem, err.message]);
    }
  }
}

module.exports = NotificationScheduler;
