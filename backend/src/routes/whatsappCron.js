/**
 * Rotas WhatsApp Cron - Endpoint para cron externo
 * Base: /api/whatsapp/cron
 * Protegido por token
 */

const express = require('express');
const router = express.Router();
const NotificationScheduler = require('../services/NotificationScheduler');

/**
 * POST /check-notifications
 * Chamado pelo cron externo a cada 5 minutos
 * Protegido por X-Cron-Token header
 */
router.post('/check-notifications', async (req, res) => {
  // Verifica token de autenticacao do cron
  const cronToken = req.headers['x-cron-token'];
  const expectedToken = process.env.CRON_TOKEN || process.env.JWT_SECRET;

  if (!cronToken || cronToken !== expectedToken) {
    return res.status(401).json({ error: 'Token invalido' });
  }

  try {
    const results = await NotificationScheduler.checkAndSend();
    res.json({
      message: 'Verificacao concluida',
      results
    });
  } catch (err) {
    console.error('Erro no cron de notificacoes:', err);
    res.status(500).json({ error: 'Erro ao processar notificacoes' });
  }
});

module.exports = router;
