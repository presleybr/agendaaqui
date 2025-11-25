const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { authenticateToken } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /api/clientes - Listar todos os clientes
router.get('/', ClienteController.getAll);

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', ClienteController.getById);

// POST /api/clientes - Criar novo cliente
router.post('/', ClienteController.create);

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', ClienteController.update);

// DELETE /api/clientes/:id - Deletar cliente
router.delete('/:id', ClienteController.delete);

module.exports = router;
