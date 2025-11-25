const express = require('express');
const router = express.Router();
const PaymentSplitService = require('../services/PaymentSplitService');
const { requireSuperAdmin } = require('../middleware/authAdmin');

/**
 * GET /api/repasses/pendentes
 * Lista todos os repasses pendentes
 * Requer: Super Admin
 */
router.get('/pendentes', requireSuperAdmin, async (req, res) => {
  try {
    console.log('📋 Listando repasses pendentes...');

    const repasses = await PaymentSplitService.listarRepassesPendentes();

    res.json({
      total: repasses.length,
      repasses: repasses.map(r => ({
        id: r.id,
        empresa_id: r.empresa_id,
        empresa_nome: r.empresa_nome,
        chave_pix: r.chave_pix,
        valor_total: r.valor_total,
        valor_empresa: r.valor_empresa,
        valor_plataforma: r.valor_plataforma,
        status_repasse: r.status_repasse,
        created_at: r.created_at
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao listar repasses:', error);
    res.status(500).json({ error: 'Erro ao listar repasses pendentes' });
  }
});

/**
 * POST /api/repasses/processar
 * Processa todos os repasses pendentes manualmente
 * Requer: Super Admin
 */
router.post('/processar', requireSuperAdmin, async (req, res) => {
  try {
    console.log('🚀 Processamento manual de repasses iniciado...');

    const resultado = await PaymentSplitService.processarRepassesPendentes();

    res.json({
      mensagem: 'Processamento concluído',
      resultado
    });
  } catch (error) {
    console.error('❌ Erro ao processar repasses:', error);
    res.status(500).json({ error: 'Erro ao processar repasses' });
  }
});

/**
 * POST /api/repasses/processar/:id
 * Processa um repasse específico
 * Requer: Super Admin
 */
router.post('/processar/:id', requireSuperAdmin, async (req, res) => {
  try {
    const splitId = parseInt(req.params.id);
    console.log(`🚀 Processando repasse #${splitId}...`);

    // Buscar split específico
    const splits = await PaymentSplitService.listarRepassesPendentes();
    const split = splits.find(s => s.id === splitId);

    if (!split) {
      return res.status(404).json({ error: 'Repasse não encontrado ou já processado' });
    }

    // Marcar como processando
    await PaymentSplitService.iniciarRepasse(splitId);

    // Processar
    const resultado = await PaymentSplitService.processarRepasse(split);

    if (resultado.sucesso) {
      await PaymentSplitService.concluirRepasse(splitId, resultado.comprovante);
      res.json({
        mensagem: 'Repasse processado com sucesso',
        comprovante: resultado.comprovante,
        detalhes: resultado.detalhes
      });
    } else {
      await PaymentSplitService.erroRepasse(splitId, resultado.mensagem);
      res.status(400).json({
        error: 'Falha ao processar repasse',
        mensagem: resultado.mensagem
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar repasse:', error);
    res.status(500).json({ error: 'Erro ao processar repasse' });
  }
});

/**
 * GET /api/repasses/empresa/:empresaId
 * Lista repasses de uma empresa específica
 * Requer: Super Admin
 */
router.get('/empresa/:empresaId', requireSuperAdmin, async (req, res) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    console.log(`📊 Buscando resumo de repasses da empresa ${empresaId}...`);

    const resumo = await PaymentSplitService.obterResumoEmpresa(empresaId);

    res.json(resumo);
  } catch (error) {
    console.error('❌ Erro ao buscar resumo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/repasses/cron
 * Endpoint para CRON job automático
 * Requer: Token especial ou API key
 */
router.post('/cron', async (req, res) => {
  try {
    // Verificar token de autorização do CRON
    const cronToken = req.headers['x-cron-token'] || req.query.token;

    if (!cronToken || cronToken !== process.env.CRON_TOKEN) {
      console.warn('⚠️  Tentativa de acesso ao CRON sem token válido');
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('⏰ CRON job de repasses iniciado...');

    const resultado = await PaymentSplitService.processarRepassesPendentes();

    res.json({
      timestamp: new Date().toISOString(),
      resultado
    });
  } catch (error) {
    console.error('❌ Erro no CRON job:', error);
    res.status(500).json({ error: 'Erro ao executar CRON job' });
  }
});

module.exports = router;
