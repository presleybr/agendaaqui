const jwt = require('jsonwebtoken');
const UsuarioAdmin = require('../models/UsuarioAdmin');

const JWT_SECRET = process.env.JWT_SECRET_ADMIN || 'your-admin-secret-key-change-this';

async function authAdmin(req, res, next) {
  try {
    // Pegar token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token malformatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token malformatado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário admin
    const admin = await UsuarioAdmin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ error: 'Usuário admin não encontrado' });
    }

    if (!admin.ativo) {
      return res.status(401).json({ error: 'Usuário admin inativo' });
    }

    // Atualizar último acesso
    await UsuarioAdmin.updateLastAccess(admin.id);

    // Adicionar admin ao request
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }

    console.error('Erro no middleware authAdmin:', error);
    return res.status(500).json({ error: 'Erro na autenticação' });
  }
}

function generateToken(adminId) {
  return jwt.sign({ id: adminId }, JWT_SECRET, {
    expiresIn: '7d' // Token expira em 7 dias
  });
}

module.exports = { authAdmin, generateToken, JWT_SECRET };
