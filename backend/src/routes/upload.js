const express = require('express');
const router = express.Router();
const { uploadMultiple, uploadSingle, deleteFile } = require('../middleware/upload');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const Empresa = require('../models/Empresa');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * POST /api/upload/empresa/:id/imagens
 * Upload de múltiplas imagens para uma empresa
 */
router.post('/empresa/:id/imagens', uploadMultiple, async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findById(id);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const urls = {};

    // Processar logo
    if (req.files.logo && req.files.logo[0]) {
      urls.logo_url = '/' + req.files.logo[0].path.replace(/\\/g, '/');
    }

    // Processar capa
    if (req.files.capa && req.files.capa[0]) {
      urls.foto_capa_url = '/' + req.files.capa[0].path.replace(/\\/g, '/');
    }

    // Processar perfil
    if (req.files.perfil && req.files.perfil[0]) {
      urls.foto_perfil_url = '/' + req.files.perfil[0].path.replace(/\\/g, '/');
    }

    // Atualizar empresa com as URLs das imagens
    if (Object.keys(urls).length > 0) {
      await Empresa.update(id, urls);
    }

    // Processar carrossel
    const carrosselUrls = [];
    if (req.files.carrossel && req.files.carrossel.length > 0) {
      for (let i = 0; i < req.files.carrossel.length; i++) {
        const file = req.files.carrossel[i];
        const imageUrl = '/' + file.path.replace(/\\/g, '/');
        await Empresa.addCarouselImage(id, imageUrl, i);
        carrosselUrls.push(imageUrl);
      }
    }

    res.json({
      mensagem: 'Imagens enviadas com sucesso',
      urls: {
        ...urls,
        carrossel: carrosselUrls
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      error: 'Erro ao fazer upload das imagens',
      details: error.message
    });
  }
});

/**
 * POST /api/upload/empresa/:id/carrossel
 * Adicionar imagem ao carrossel
 */
router.post('/empresa/:id/carrossel', uploadSingle, async (req, res) => {
  try {
    const { id } = req.params;
    const { ordem } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const imageUrl = '/' + req.file.path.replace(/\\/g, '/');
    const result = await Empresa.addCarouselImage(id, imageUrl, parseInt(ordem) || 0);

    res.json({
      mensagem: 'Imagem adicionada ao carrossel',
      imagem: result
    });
  } catch (error) {
    console.error('Erro ao adicionar imagem:', error);
    res.status(500).json({
      error: 'Erro ao adicionar imagem ao carrossel',
      details: error.message
    });
  }
});

/**
 * DELETE /api/upload/carrossel/:id
 * Deletar imagem do carrossel
 */
router.delete('/carrossel/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar a imagem antes de deletar para pegar o caminho do arquivo
    // TODO: Implementar busca da imagem
    await Empresa.deleteCarouselImage(id);

    res.json({ mensagem: 'Imagem deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({
      error: 'Erro ao deletar imagem',
      details: error.message
    });
  }
});

/**
 * GET /api/upload/empresa/:id/carrossel
 * Listar imagens do carrossel
 */
router.get('/empresa/:id/carrossel', async (req, res) => {
  try {
    const { id } = req.params;
    const imagens = await Empresa.getCarouselImages(id);

    res.json(imagens);
  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    res.status(500).json({
      error: 'Erro ao buscar imagens do carrossel',
      details: error.message
    });
  }
});

module.exports = router;
