const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authAdmin } = require('../middleware/authAdmin');

// Rotas públicas (sem autenticação)
router.post('/login', AdminController.login);

// Rotas protegidas (requerem autenticação)
router.use(authAdmin);

// Dashboard
router.get('/dashboard', AdminController.getDashboard);
router.get('/me', AdminController.getMe);

// Gerenciamento de Empresas
router.get('/empresas', AdminController.listarEmpresas);
router.post('/empresas', AdminController.criarEmpresa);
router.get('/empresas/:id', AdminController.getEmpresa);
router.put('/empresas/:id', AdminController.atualizarEmpresa);
router.delete('/empresas/:id', AdminController.deletarEmpresa);

// Configurações do Sistema
router.get('/configuracoes', AdminController.getConfiguracoes);
router.put('/configuracoes', AdminController.atualizarConfiguracoes);

// Transações
router.get('/transacoes', AdminController.listarTransacoes);

module.exports = router;
