const express = require('express');
const router = express.Router();
const AgendamentoController = require('../controllers/agendamentoController');
const { authenticateToken } = require('../middleware/auth');
const validators = require('../utils/validators');

// Rotas públicas
router.post('/', validators.agendamento, AgendamentoController.create);
router.get('/protocolo/:protocolo', AgendamentoController.getByProtocolo);

// Rotas protegidas (apenas admin)
router.get('/', authenticateToken, AgendamentoController.getAll);
router.get('/stats', authenticateToken, AgendamentoController.getStats);
router.get('/:id', authenticateToken, AgendamentoController.getById);
router.patch('/:id/status', authenticateToken, validators.updateStatus, AgendamentoController.updateStatus);
router.put('/:id', authenticateToken, AgendamentoController.update);
router.delete('/:id', authenticateToken, AgendamentoController.delete);

module.exports = router;
