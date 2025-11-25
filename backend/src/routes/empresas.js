const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/empresaController');
const { body } = require('express-validator');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Todas as rotas requerem autenticação de Super Admin
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/empresas/dashboard
 * Dashboard consolidado de todas as empresas
 */
router.get('/dashboard', EmpresaController.dashboard);

/**
 * GET /api/admin/empresas
 * Listar todas as empresas
 * Query params: ?status=ativo&plano=basico
 */
router.get('/', EmpresaController.list);

/**
 * GET /api/admin/empresas/:id
 * Buscar empresa por ID com métricas dos últimos 6 meses
 */
router.get('/:id', EmpresaController.getById);

/**
 * POST /api/admin/empresas
 * Criar nova empresa cliente
 */
router.post('/', [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('slug')
    .notEmpty().withMessage('Slug é obrigatório')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug deve conter apenas letras minúsculas, números e hífen'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('chave_pix').notEmpty().withMessage('Chave PIX é obrigatória'),
  body('preco_cautelar').optional().isInt({ min: 0 }).withMessage('Preço cautelar deve ser um número positivo'),
  body('preco_transferencia').optional().isInt({ min: 0 }).withMessage('Preço transferência deve ser um número positivo'),
  body('preco_outros').optional().isInt({ min: 0 }).withMessage('Preço outros deve ser um número positivo')
], EmpresaController.create);

/**
 * PUT /api/admin/empresas/:id
 * Atualizar empresa
 */
router.put('/:id', [
  body('nome').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('email').optional().isEmail().withMessage('E-mail inválido'),
  body('chave_pix').optional().notEmpty().withMessage('Chave PIX não pode ser vazia')
], EmpresaController.update);

/**
 * PATCH /api/admin/empresas/:id/status
 * Alterar status da empresa
 */
router.patch('/:id/status', [
  body('status')
    .isIn(['ativo', 'inativo', 'suspenso', 'trial'])
    .withMessage('Status inválido')
], EmpresaController.toggleStatus);

/**
 * GET /api/admin/empresas/:id/comissao
 * Verificar período de comissão (30 dias)
 */
router.get('/:id/comissao', EmpresaController.verificarPeriodoComissao);

/**
 * DELETE /api/admin/empresas/:id
 * Deletar empresa (cascata: deleta todos os dados relacionados)
 */
router.delete('/:id', EmpresaController.delete);

module.exports = router;
