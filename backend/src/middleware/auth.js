const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findById(decoded.id);

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo' });
    }

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.usuario = usuario;

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.name, error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido', detalhes: error.message });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Erro na autenticação', detalhes: error.message });
  }
};

/**
 * Middleware para verificar se é Super Admin
 * Todos os usuários da tabela usuarios_admin são considerados super admins
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Se chegou aqui, é porque passou pelo authenticateToken
  // e é um usuário da tabela usuarios_admin
  console.log(`✅ Super Admin: ${req.usuario.email}`);
  next();
};

/**
 * Middleware para verificar se é Admin de Empresa (cliente)
 * TODO: Implementar quando criar tabela de admins por empresa
 */
const requireEmpresaAdmin = (req, res, next) => {
  // Por enquanto, apenas verificar se tem empresa_id no token
  if (!req.empresaId) {
    return res.status(403).json({ error: 'Acesso restrito a administradores de empresa' });
  }
  next();
};

// Manter compatibilidade com código antigo
const authMiddleware = authenticateToken;

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireEmpresaAdmin,
  authMiddleware // compatibilidade
};
