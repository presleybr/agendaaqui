const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/configController');
const { authenticateToken } = require('../middleware/auth');
const validators = require('../utils/validators');

// Todas as rotas de configuração são protegidas
router.get('/', authenticateToken, ConfigController.getAll);
router.get('/:chave', authenticateToken, ConfigController.get);
router.put('/', authenticateToken, validators.configuracao, ConfigController.update);

module.exports = router;
