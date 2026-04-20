/**
 * Notification Dispatcher - dispara mensagens WhatsApp em eventos criticos.
 *
 * Multi-tenant: cada mensagem usa a sessao Baileys da empresa do agendamento.
 * Fail-safe: se o WhatsApp nao estiver conectado, apenas loga e continua —
 * nunca derruba o fluxo principal (criar agendamento / aprovar pagamento).
 */

const db = require('../config/database');
const whatsAppManager = require('./WhatsAppService');
const MessageTemplates = require('./MessageTemplates');

async function getConfig(empresaId) {
  const r = await db.query(
    `SELECT wc.telefone_gerente, wc.ativo, wc.connection_status,
            e.nome as empresa_nome
     FROM whatsapp_config wc
     JOIN empresas e ON e.id = wc.empresa_id
     WHERE wc.empresa_id = $1`,
    [empresaId]
  );
  return r.rows[0] || null;
}

async function alreadySent(empresaId, agendamentoId, tipo) {
  const r = await db.query(
    `SELECT 1 FROM whatsapp_notificacoes_log
     WHERE empresa_id = $1 AND agendamento_id = $2 AND tipo = $3 AND status = 'enviado'
     LIMIT 1`,
    [empresaId, agendamentoId, tipo]
  );
  return r.rowCount > 0;
}

async function send(empresaId, agendamentoId, tipo, telefone, mensagem) {
  if (!telefone) return;
  try {
    await whatsAppManager.sendMessage(empresaId, telefone, mensagem);
    await db.query(
      `INSERT INTO whatsapp_notificacoes_log (empresa_id, agendamento_id, tipo, telefone_destino, mensagem, status)
       VALUES ($1, $2, $3, $4, $5, 'enviado')`,
      [empresaId, agendamentoId, tipo, telefone, mensagem]
    );
  } catch (err) {
    console.error(`[NotifDispatcher] ${tipo} empresa=${empresaId} agend=${agendamentoId}:`, err.message);
    try {
      await db.query(
        `INSERT INTO whatsapp_notificacoes_log (empresa_id, agendamento_id, tipo, telefone_destino, mensagem, status, erro_detalhes)
         VALUES ($1, $2, $3, $4, $5, 'erro', $6)`,
        [empresaId, agendamentoId, tipo, telefone, mensagem, err.message]
      );
    } catch (_) { /* log nao bloqueia */ }
  }
}

/**
 * Dispara mensagens para cliente e gerente quando agendamento e criado.
 */
async function notifyAgendamentoCriado(agendamento) {
  try {
    if (!agendamento?.empresa_id) return;
    const cfg = await getConfig(agendamento.empresa_id);
    if (!cfg || !cfg.ativo) return;
    if (!whatsAppManager.isConnected(agendamento.empresa_id)) return;

    const tipoCli = 'agendamento_criado_cliente';
    const tipoGer = 'agendamento_criado_gerente';

    if (agendamento.cliente_telefone && !(await alreadySent(agendamento.empresa_id, agendamento.id, tipoCli))) {
      const msg = MessageTemplates.agendamentoCriadoCliente(agendamento, cfg.empresa_nome);
      await send(agendamento.empresa_id, agendamento.id, tipoCli, agendamento.cliente_telefone, msg);
    }

    if (cfg.telefone_gerente && !(await alreadySent(agendamento.empresa_id, agendamento.id, tipoGer))) {
      const msg = MessageTemplates.agendamentoCriadoGerente(agendamento);
      await send(agendamento.empresa_id, agendamento.id, tipoGer, cfg.telefone_gerente, msg);
    }
  } catch (err) {
    console.error('[NotifDispatcher] notifyAgendamentoCriado:', err.message);
  }
}

/**
 * Dispara mensagens quando pagamento e aprovado (PIX manual ou Mercado Pago).
 * Deduplicado: evita enviar duas vezes se webhook e polling dispararem juntos.
 */
async function notifyPagamentoAprovado(agendamento) {
  try {
    if (!agendamento?.empresa_id) return;
    const cfg = await getConfig(agendamento.empresa_id);
    if (!cfg || !cfg.ativo) return;
    if (!whatsAppManager.isConnected(agendamento.empresa_id)) return;

    const tipoCli = 'pagamento_aprovado_cliente';
    const tipoGer = 'pagamento_aprovado_gerente';

    if (agendamento.cliente_telefone && !(await alreadySent(agendamento.empresa_id, agendamento.id, tipoCli))) {
      const msg = MessageTemplates.pagamentoAprovadoCliente(agendamento, cfg.empresa_nome);
      await send(agendamento.empresa_id, agendamento.id, tipoCli, agendamento.cliente_telefone, msg);
    }

    if (cfg.telefone_gerente && !(await alreadySent(agendamento.empresa_id, agendamento.id, tipoGer))) {
      const msg = MessageTemplates.pagamentoAprovadoGerente(agendamento);
      await send(agendamento.empresa_id, agendamento.id, tipoGer, cfg.telefone_gerente, msg);
    }
  } catch (err) {
    console.error('[NotifDispatcher] notifyPagamentoAprovado:', err.message);
  }
}

module.exports = {
  notifyAgendamentoCriado,
  notifyPagamentoAprovado
};
