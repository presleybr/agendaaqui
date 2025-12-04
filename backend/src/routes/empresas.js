const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/empresaController');
const { body } = require('express-validator');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

/**
 * Rotas públicas (sem autenticação)
 */

/**
 * GET /api/empresas/buscar
 * Buscar empresas por cidade/estado para o marketplace
 * Query params: ?cidade=&estado=&lat=&lng=
 */
router.get('/buscar', EmpresaController.buscarEmpresas);

/**
 * GET /api/empresas/cidades
 * Listar cidades disponíveis com empresas ativas
 */
router.get('/cidades', EmpresaController.listarCidades);

/**
 * GET /api/empresas/public/:slug
 * Buscar empresa por slug - rota explícita com /public/
 */
router.get('/public/:slug', EmpresaController.getBySlug);

/**
 * GET /api/empresas/:slug
 * Buscar empresa por slug (público) - rota direta
 * NOTA: Esta rota deve vir DEPOIS de rotas mais específicas como /public/:slug
 */
router.get('/:slug', (req, res, next) => {
  const { slug } = req.params;

  // Se for um ID numérico ou rota conhecida, passa para próximo handler
  if (!isNaN(slug) || ['public', 'admin', 'dashboard'].includes(slug)) {
    return next();
  }

  // Caso contrário, trata como slug de empresa
  EmpresaController.getBySlug(req, res, next);
});

/**
 * GET /api/empresas/:id/carrossel
 * Listar imagens do carrossel (público)
 */
router.get('/:id/carrossel', EmpresaController.getCarrosselImages);

/**
 * Rotas administrativas (requerem autenticação)
 */

// Aplicar autenticação para rotas admin
const adminRouter = express.Router();
adminRouter.use(authenticateToken);
adminRouter.use(requireSuperAdmin);

/**
 * GET /api/admin/empresas/dashboard
 * Dashboard consolidado de todas as empresas
 */
adminRouter.get('/dashboard', EmpresaController.dashboard);

/**
 * GET /api/admin/empresas
 * Listar todas as empresas
 * Query params: ?status=ativo&plano=basico
 */
adminRouter.get('/', EmpresaController.list);

/**
 * GET /api/admin/empresas/:id
 * Buscar empresa por ID com métricas dos últimos 6 meses
 */
adminRouter.get('/:id', EmpresaController.getById);

/**
 * POST /api/admin/empresas
 * Criar nova empresa cliente
 */
adminRouter.post('/', [
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
adminRouter.put('/:id', [
  body('nome').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('email').optional().isEmail().withMessage('E-mail inválido'),
  body('chave_pix').optional().notEmpty().withMessage('Chave PIX não pode ser vazia')
], EmpresaController.update);

/**
 * PATCH /api/admin/empresas/:id/status
 * Alterar status da empresa
 */
adminRouter.patch('/:id/status', [
  body('status')
    .isIn(['ativo', 'inativo', 'suspenso', 'trial'])
    .withMessage('Status inválido')
], EmpresaController.toggleStatus);

/**
 * GET /api/admin/empresas/:id/comissao
 * Verificar período de comissão (30 dias)
 */
adminRouter.get('/:id/comissao', EmpresaController.verificarPeriodoComissao);

/**
 * DELETE /api/admin/empresas/:id
 * Deletar empresa (cascata: deleta todos os dados relacionados)
 */
adminRouter.delete('/:id', EmpresaController.delete);

// Montar rotas admin em /admin
router.use('/admin', adminRouter);

module.exports = router;
