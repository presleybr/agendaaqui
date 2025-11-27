/**
 * Middleware de autenticação para usuários de empresas (Painel CRM)
 * Diferente do auth.js que é para o Super Admin
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware principal de autenticação para empresas
 * Verifica token JWT e adiciona dados do usuário ao request
 */
const authEmpresa = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se é token de empresa (não de admin do sistema)
    if (decoded.tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso não autorizado para este tipo de usuário' });
    }

    // Verificar se usuário ainda está ativo no banco
    const result = await db.query(
      `SELECT u.id, u.empresa_id, u.role, u.ativo, e.status as empresa_status
       FROM usuarios_empresa u
       JOIN empresas e ON u.empresa_id = e.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const usuario = result.rows[0];

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }

    if (usuario.empresa_status !== 'ativo') {
      return res.status(401).json({ error: 'Empresa inativa ou suspensa' });
    }

    // Adicionar dados do usuário ao request
    req.usuarioEmpresa = {
      id: decoded.id,
      empresa_id: decoded.empresa_id,
      email: decoded.email,
      role: decoded.role
    };
    req.empresa_id = decoded.empresa_id;

    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido', code: 'TOKEN_INVALID' });
    }
    console.error('Erro na autenticação empresa:', err);
    res.status(500).json({ error: 'Erro interno de autenticação' });
  }
};

/**
 * Middleware para verificar role específica
 * Uso: requireRole('admin', 'gerente')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.usuarioEmpresa) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.usuarioEmpresa.role)) {
      return res.status(403).json({
        error: 'Permissão insuficiente',
        required: roles,
        current: req.usuarioEmpresa.role
      });
    }

    next();
  };
};

/**
 * Middleware opcional - apenas verifica token se presente
 * Útil para rotas que funcionam com ou sem autenticação
 */
const authEmpresaOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continua sem autenticação
  }

  // Se tem token, tenta validar
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo === 'empresa') {
      req.usuarioEmpresa = {
        id: decoded.id,
        empresa_id: decoded.empresa_id,
        email: decoded.email,
        role: decoded.role
      };
      req.empresa_id = decoded.empresa_id;
    }
  } catch (err) {
    // Ignora erros de token em autenticação opcional
  }

  next();
};

module.exports = {
  authEmpresa,
  requireRole,
  authEmpresaOptional
};
