const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authEmpresa } = require('../middleware/authEmpresa');
const MensalidadeService = require('../services/MensalidadeService');

const comprovanteDir = path.join(__dirname, '../../../uploads/mensalidades');
if (!fs.existsSync(comprovanteDir)) fs.mkdirSync(comprovanteDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, comprovanteDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `mens-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|pdf/.test(file.mimetype) ||
               /\.(jpe?g|png|webp|pdf)$/i.test(file.originalname);
    cb(ok ? null : new Error('Formato invalido (use JPG, PNG, WEBP ou PDF)'), ok);
  }
}).single('comprovante');

router.get('/planos', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, nome, slug, preco_centavos, limite_agendamentos_mes, features, ordem
       FROM planos_mensalidade WHERE ativo = true ORDER BY ordem ASC, preco_centavos ASC`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/minha', authEmpresa, async (req, res) => {
  try {
    const data = await MensalidadeService.minhaMensalidade(req.empresa_id);
    if (!data.atual && data.empresa && !data.empresa.mensalidade_isenta && data.empresa.plano_id) {
      const gen = await MensalidadeService.gerarMensalidadeEmpresa(req.empresa_id);
      if (gen.created) data.atual = gen.mensalidade;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/gerar-pix', authEmpresa, async (req, res) => {
  try {
    const mens = await db.query(
      'SELECT empresa_id FROM mensalidades WHERE id = $1',
      [req.params.id]
    );
    if (!mens.rows[0]) return res.status(404).json({ error: 'Mensalidade nao encontrada' });
    if (mens.rows[0].empresa_id !== req.empresa_id) {
      return res.status(403).json({ error: 'Nao autorizado' });
    }
    const data = await MensalidadeService.gerarPix(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/comprovante', authEmpresa, (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    try {
      const mens = await db.query(
        'SELECT empresa_id FROM mensalidades WHERE id = $1',
        [req.params.id]
      );
      if (!mens.rows[0]) return res.status(404).json({ error: 'Mensalidade nao encontrada' });
      if (mens.rows[0].empresa_id !== req.empresa_id) {
        return res.status(403).json({ error: 'Nao autorizado' });
      }
      const url = '/uploads/mensalidades/' + req.file.filename;
      const updated = await MensalidadeService.registrarComprovante(req.params.id, url);
      res.json({ success: true, mensalidade: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

module.exports = router;
