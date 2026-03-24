/**
 * Rotas WhatsApp do Painel da Empresa
 * Base: /api/empresa/painel/whatsapp
 * Todas requerem autenticacao de empresa
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authEmpresa } = require('../middleware/authEmpresa');
const whatsAppManager = require('../services/WhatsAppService');
const MessageTemplates = require('../services/MessageTemplates');

// Todas as rotas requerem autenticacao
router.use(authEmpresa);

/**
 * GET /config - Retorna configuracao WhatsApp da empresa
 */
router.get('/config', async (req, res) => {
  try {
    // Garante que existe registro
    await db.query(`
      INSERT INTO whatsapp_config (empresa_id) VALUES ($1)
      ON CONFLICT (empresa_id) DO NOTHING
    `, [req.empresa_id]);

    const result = await db.query(`
      SELECT empresa_id, telefone_gerente, ativo,
             notif_antes_ativo, notif_antes_minutos,
             notif_inicio_ativo,
             notif_resumo_diario_ativo, notif_resumo_horario,
             connection_status, last_connected_at, last_error
      FROM whatsapp_config WHERE empresa_id = $1
    `, [req.empresa_id]);

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Erro ao buscar config WhatsApp:', err);
    res.status(500).json({ error: 'Erro ao buscar configuracao' });
  }
});

/**
 * PUT /config - Salva configuracoes
 */
router.put('/config', async (req, res) => {
  try {
    const {
      telefone_gerente, ativo,
      notif_antes_ativo, notif_antes_minutos,
      notif_inicio_ativo,
      notif_resumo_diario_ativo, notif_resumo_horario
    } = req.body;

    await db.query(`
      INSERT INTO whatsapp_config (empresa_id, telefone_gerente, ativo, notif_antes_ativo, notif_antes_minutos, notif_inicio_ativo, notif_resumo_diario_ativo, notif_resumo_horario)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (empresa_id) DO UPDATE SET
        telefone_gerente = $2, ativo = $3,
        notif_antes_ativo = $4, notif_antes_minutos = $5,
        notif_inicio_ativo = $6,
        notif_resumo_diario_ativo = $7, notif_resumo_horario = $8,
        updated_at = CURRENT_TIMESTAMP
    `, [
      req.empresa_id, telefone_gerente, ativo,
      notif_antes_ativo, notif_antes_minutos,
      notif_inicio_ativo,
      notif_resumo_diario_ativo, notif_resumo_horario
    ]);

    res.json({ message: 'Configuracao salva com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar config WhatsApp:', err);
    res.status(500).json({ error: 'Erro ao salvar configuracao' });
  }
});

/**
 * POST /connect - Inicia sessao Baileys e gera QR
 */
router.post('/connect', async (req, res) => {
  try {
    const result = await whatsAppManager.initSession(req.empresa_id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao conectar WhatsApp:', err);
    res.status(500).json({ error: 'Erro ao iniciar conexao WhatsApp' });
  }
});

/**
 * GET /qr - Retorna QR code atual e status (polling)
 */
router.get('/qr', (req, res) => {
  const { qr, status } = whatsAppManager.getQRCode(req.empresa_id);
  res.json({ qr, status });
});

/**
 * GET /status - Status da conexao
 */
router.get('/status', async (req, res) => {
  try {
    const status = await whatsAppManager.getStatus(req.empresa_id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

/**
 * POST /disconnect - Desconecta e limpa sessao
 */
router.post('/disconnect', async (req, res) => {
  try {
    await whatsAppManager.disconnect(req.empresa_id);
    res.json({ message: 'Desconectado com sucesso' });
  } catch (err) {
    console.error('Erro ao desconectar WhatsApp:', err);
    res.status(500).json({ error: 'Erro ao desconectar' });
  }
});

/**
 * POST /test - Envia mensagem de teste ao gerente
 */
router.post('/test', async (req, res) => {
  try {
    const config = await db.query(
      'SELECT telefone_gerente FROM whatsapp_config WHERE empresa_id = $1',
      [req.empresa_id]
    );

    const telefone = config.rows[0]?.telefone_gerente;
    if (!telefone) {
      return res.status(400).json({ error: 'Telefone do gerente nao configurado' });
    }

    const msg = MessageTemplates.teste();
    await whatsAppManager.sendMessage(req.empresa_id, telefone, msg);

    // Loga no historico
    await db.query(`
      INSERT INTO whatsapp_notificacoes_log (empresa_id, tipo, telefone_destino, mensagem, status)
      VALUES ($1, 'teste', $2, $3, 'enviado')
    `, [req.empresa_id, telefone, msg]);

    res.json({ message: 'Mensagem de teste enviada!' });
  } catch (err) {
    console.error('Erro ao enviar teste WhatsApp:', err);
    res.status(500).json({ error: err.message || 'Erro ao enviar mensagem de teste' });
  }
});

/**
 * GET /log - Ultimas 20 notificacoes
 */
router.get('/log', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, tipo, telefone_destino, mensagem, status, erro_detalhes, created_at
      FROM whatsapp_notificacoes_log
      WHERE empresa_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.empresa_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar log WhatsApp:', err);
    res.status(500).json({ error: 'Erro ao buscar historico' });
  }
});

module.exports = router;
