const Empresa = require('../models/Empresa');

/**
 * Middleware para detectar o tenant (empresa) baseado no subdomínio
 * Exemplo:
 * - empresa1.seudominio.com -> empresa com slug "empresa1"
 * - www.seudominio.com ou seudominio.com -> sem tenant (sistema principal)
 */
async function detectTenant(req, res, next) {
  try {
    const host = req.get('host') || '';

    // Extrair subdomínio
    const subdomain = extractSubdomain(host);

    // Se não tem subdomínio ou é www/admin, não é um tenant
    if (!subdomain || subdomain === 'www' || subdomain === 'admin') {
      req.tenant = null;
      req.isAdmin = subdomain === 'admin';
      return next();
    }

    // Buscar empresa pelo slug (subdomínio)
    const empresa = await Empresa.findBySlug(subdomain);

    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        subdomain
      });
    }

    if (empresa.status !== 'ativo') {
      return res.status(403).json({
        error: 'Empresa inativa ou suspensa'
      });
    }

    // Adicionar empresa ao request
    req.tenant = empresa;
    req.empresaId = empresa.id;

    next();
  } catch (error) {
    console.error('Erro no middleware de tenant:', error);
    res.status(500).json({ error: 'Erro ao detectar tenant' });
  }
}

/**
 * Middleware que requer que a requisição seja de um tenant específico
 */
function requireTenant(req, res, next) {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'Esta requisição deve ser feita através de um subdomínio de empresa válido'
    });
  }
  next();
}

/**
 * Extrai o subdomínio do host
 * Exemplos:
 * - empresa1.localhost:3000 -> empresa1
 * - empresa1.seudominio.com -> empresa1
 * - www.seudominio.com -> www
 * - seudominio.com -> null
 */
function extractSubdomain(host) {
  // Remover porta se houver
  const hostname = host.split(':')[0];

  // Dividir por pontos
  const parts = hostname.split('.');

  // Se tem menos de 2 partes, não é um subdomínio válido
  if (parts.length < 2) {
    return null;
  }

  // Detectar subdomínios em plataformas de hospedagem (Render, Vercel, etc)
  // Ex: empresa1.agendaaqui-frontend.onrender.com -> "empresa1"
  if (hostname.includes('.onrender.com')) {
    // Se tiver mais de 3 partes, é um subdomínio
    // Ex: empresa1.agendaaqui-frontend.onrender.com = 4 partes
    if (parts.length > 3) {
      const subdomain = parts[0];
      // Ignorar subdomínios reservados
      if (['www', 'admin', 'api', 'app'].includes(subdomain)) {
        return null;
      }
      return subdomain;
    }
    // agendaaqui-frontend.onrender.com = 3 partes, não é tenant
    return null;
  }

  // Ignorar outros domínios de infraestrutura (Vercel, Heroku, Railway)
  const infraDomains = ['vercel.app', 'herokuapp.com', 'railway.app'];
  for (const infraDomain of infraDomains) {
    if (hostname.includes(infraDomain)) {
      return null; // Não é um tenant, é o próprio backend
    }
  }

  // Para desenvolvimento local (*.localhost)
  if (hostname.includes('localhost')) {
    return parts.length > 1 ? parts[0] : null;
  }

  // Para agendaaquivistorias.com.br (domínio principal)
  if (hostname === 'agendaaquivistorias.com.br' || hostname === 'www.agendaaquivistorias.com.br') {
    return null; // Site principal, não é tenant
  }

  // Para domínios normais, retornar primeira parte se tiver mais de 2 partes
  // exemplo.com.br = 3 partes (nível adicional)
  // exemplo.com = 2 partes
  if (parts.length >= 3) {
    // Verificar se é um domínio .com.br, .co.uk, etc
    const tld = parts.slice(-2).join('.');
    const commonTLDs = ['com.br', 'co.uk', 'com.au'];

    if (commonTLDs.includes(tld)) {
      // Para .com.br, precisa ter 4+ partes para ser subdomínio
      // ex: empresa.agendaaquivistorias.com.br tem 4 partes
      if (parts.length > 3) {
        const subdomain = parts[0];
        // Ignorar subdomínios reservados
        if (['www', 'admin', 'api', 'app'].includes(subdomain)) {
          return null;
        }
        return subdomain;
      }
      return null;
    }

    // Para domínios .com normais (ex: empresa.example.com)
    const subdomain = parts[0];
    if (['www', 'admin', 'api', 'app'].includes(subdomain)) {
      return null;
    }
    return subdomain;
  }

  return null;
}

module.exports = { detectTenant, requireTenant, extractSubdomain };
