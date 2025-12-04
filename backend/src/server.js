require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');
const { detectTenant } = require('./middleware/tenantMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const agendamentosRoutes = require('./routes/agendamentos');
const availabilityRoutes = require('./routes/availability');
const configRoutes = require('./routes/config');
const clientesRoutes = require('./routes/clientes');
const notificationsRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const empresasRoutes = require('./routes/empresas');
const tenantRoutes = require('./routes/tenant');
const repassesRoutes = require('./routes/repasses');
const uploadRoutes = require('./routes/upload');

// Rotas do Painel CRM da Empresa
const authEmpresaRoutes = require('./routes/authEmpresa');
const painelEmpresaRoutes = require('./routes/painelEmpresa');

// Rotas completas do Super Admin
const superAdminRoutes = require('./routes/superAdmin');

const app = express();

// Trust proxy - necessário para Render, Heroku, etc (proxies reversos)
// Isso permite que o rate limiting funcione corretamente
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for static files in production
  crossOriginEmbedderPolicy: false
}));

// Serve public folder for static assets (admin panel, etc.)
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve uploads folder for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static files from frontend build in production BEFORE any other middleware
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  const fs = require('fs');

  // Verificar se o diretório do frontend existe
  if (fs.existsSync(frontendPath)) {
    console.log("✅ Serving static files from:", frontendPath);

    // Serve static files with proper MIME types
    app.use(express.static(frontendPath, {
      setHeaders: (res, filePath) => {
        // Set correct MIME types for assets
        if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    }));
  } else {
    console.log("⚠️  Frontend dist not found at:", frontendPath);
    console.log("📌 API-only mode: Frontend should be served separately");
  }
}

// CORS - Allow both common Vite ports and LocalTunnel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://agendaaquivistorias.com.br',
  'http://agendaaquivistorias.com.br'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow subdomains of main domain (for multi-tenant)
    if (origin && origin.match(/https?:\/\/.*\.agendaaquivistorias\.com\.br$/)) {
      return callback(null, true);
    }

    // Allow LocalTunnel URLs (*.loca.lt)
    if (origin && origin.match(/https?:\/\/.*\.loca\.lt$/)) {
      return callback(null, true);
    }

    // Allow if FRONTEND_URL is wildcard
    if (process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

    // In production, if serving frontend from same domain, allow it
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

    console.log('⚠️  CORS blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

// Apply CORS only to API routes
app.use('/api', cors(corsOptions));

// Handle preflight requests explicitly
app.options('/api/*', cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tenant detection middleware (detecta subdomínio)
app.use(detectTenant);

// Rate limiting mais flexível para desenvolvimento
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 em dev, 100 em produção
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  skip: (req) => {
    // Skip rate limiting para localhost em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});

const agendamentoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 100 em dev, 10 em produção
  message: 'Limite de agendamentos excedido, tente novamente mais tarde.',
  skip: (req) => {
    // Skip rate limiting para localhost em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});

app.use('/api/', limiter);

// Health check com verificação de banco de dados PostgreSQL
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: false,
      type: 'postgresql',
      message: '',
      hasUrl: !!process.env.DATABASE_URL
    }
  };

  try {
    // Testa a conexão com PostgreSQL
    const result = await db.query('SELECT NOW() as now, current_database() as database');
    healthCheck.database.connected = true;
    healthCheck.database.message = 'Conexão PostgreSQL estabelecida';
    healthCheck.database.currentDb = result.rows[0].database;
    healthCheck.database.serverTime = result.rows[0].now;
  } catch (error) {
    healthCheck.status = 'degraded';
    healthCheck.database.connected = false;
    healthCheck.database.message = `Erro na conexão: ${error.message}`;
    healthCheck.database.errorCode = error.code;

    console.error('❌ Health check - Erro ao conectar com banco:', {
      message: error.message,
      code: error.code,
      hasUrl: !!process.env.DATABASE_URL
    });
  }

  // Retorna status HTTP 200 sempre (para não derrubar o serviço)
  // Status de saúde do banco está no JSON
  res.status(200).json(healthCheck);
});

// Admin Routes (protegidas por autenticação)
// IMPORTANTE: Rotas mais específicas devem vir primeiro
app.use('/api/admin/empresas', empresasRoutes);
app.use('/api/admin', adminRoutes);

// Super Admin Routes (rotas completas do CRM)
app.use('/api/super-admin', superAdminRoutes);

// Upload Routes (requerem autenticação)
app.use('/api/upload', uploadRoutes);

// Rotas públicas de empresas (para página de agendamento)
app.use('/api/empresas', empresasRoutes);

// Rotas do Painel CRM da Empresa (autenticação própria)
app.use('/api/empresa/auth', authEmpresaRoutes);
app.use('/api/empresa/painel', painelEmpresaRoutes);

// Repasses Routes (transferências PIX automáticas)
app.use('/api/repasses', repassesRoutes);

// Tenant Routes (requer subdomínio válido)
app.use('/api/tenant', tenantRoutes);

// Public Routes (sistema de agendamento)
app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/config', configRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payment', paymentRoutes);

// Apply stricter rate limit to agendamento creation
app.post('/api/agendamentos', agendamentoLimiter);

// Serve Admin Panel at /admin route
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '../../frontend/admin.html');
  const fs = require('fs');

  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Admin panel not found');
  }
});

// Serve Cliente Panel at /cliente route (Painel da Empresa/Vistoriador)
app.get('/cliente', (req, res) => {
  const fs = require('fs');
  const prodPath = path.join(__dirname, '../../frontend/dist/cliente.html');
  const devPath = path.join(__dirname, '../../frontend/cliente.html');

  let clientePath = process.env.NODE_ENV === 'production' ? prodPath : devPath;

  // Fallback se não encontrar no caminho de produção
  if (!fs.existsSync(clientePath) && process.env.NODE_ENV === 'production') {
    clientePath = devPath;
  }

  if (fs.existsSync(clientePath)) {
    res.sendFile(clientePath);
  } else {
    res.status(404).send('Cliente panel not found');
  }
});

// Rota para páginas de empresas (URLs amigáveis)
// Deve vir ANTES do catch-all do SPA
// Exemplos: /vistoriapremium, /vistoria-express-sp
app.get('/:slug([a-z0-9-]+)', (req, res, next) => {
  const fs = require('fs');
  const slug = req.params.slug;

  // Lista de rotas reservadas que NÃO são slugs de empresas
  const reservedRoutes = [
    'admin',
    'cliente',
    'api',
    'assets',
    'uploads',
    'src',
    'dist',
    'health',
    'favicon',
    'robots',
    'sitemap',
    'index'
  ];

  // Se for uma rota reservada ou tiver extensão de arquivo, passa para o próximo handler
  if (reservedRoutes.includes(slug) || slug.includes('.')) {
    return next();
  }

  console.log(`🏢 Tentando carregar empresa com slug: ${slug}`);

  // Em produção, o arquivo está em frontend/dist/empresa.html
  // Em desenvolvimento, está em frontend/empresa.html
  const prodPath = path.join(__dirname, '../../frontend/dist/empresa.html');
  const devPath = path.join(__dirname, '../../frontend/empresa.html');

  let empresaPath = process.env.NODE_ENV === 'production' ? prodPath : devPath;

  // Fallback: tenta ambos os caminhos
  if (!fs.existsSync(empresaPath)) {
    empresaPath = fs.existsSync(prodPath) ? prodPath : devPath;
  }

  console.log(`📁 Buscando arquivo em: ${empresaPath}`);
  console.log(`📁 Arquivo existe: ${fs.existsSync(empresaPath)}`);

  if (fs.existsSync(empresaPath)) {
    console.log(`✅ Servindo empresa.html para slug: ${slug}`);
    res.sendFile(empresaPath);
  } else {
    console.warn('❌ empresa.html não encontrado em nenhum caminho');
    console.warn('   Tentou:', prodPath);
    console.warn('   Tentou:', devPath);
    next();
  }
});

// Handle client-side routing in production - serve index.html for all non-API routes
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  const fs = require('fs');
  const indexPath = path.join(frontendPath, 'index.html');
  const frontendExists = fs.existsSync(indexPath);

  // Handle client-side routing - serve index.html for all non-API, non-asset routes
  app.get('*', (req, res) => {
    // Don't intercept API routes
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Rota não encontrada' });
      return;
    }

    // Don't intercept static asset requests (they should have been handled by express.static)
    // If we got here and it's an asset request, it means the file doesn't exist
    if (req.path.startsWith('/assets/') ||
        req.path.endsWith('.js') ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.ico') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path.endsWith('.svg')) {
      res.status(404).send('File not found');
      return;
    }

    // For all other routes, serve the SPA index.html if it exists
    if (frontendExists) {
      res.sendFile(indexPath);
    } else {
      res.status(200).json({
        message: 'API Server Running',
        note: 'Frontend should be served separately',
        api_docs: '/api/health'
      });
    }
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Inicia o LocalTunnel se estiver habilitado
  if (process.env.ENABLE_TUNNEL === 'true') {
    console.log('');
    const { startTunnel } = require('./utils/tunnel');
    await startTunnel();
  }
});

module.exports = app;
