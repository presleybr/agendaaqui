require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const agendamentosRoutes = require('./routes/agendamentos');
const availabilityRoutes = require('./routes/availability');
const configRoutes = require('./routes/config');
const clientesRoutes = require('./routes/clientes');
const notificationsRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payment');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for static files in production
  crossOriginEmbedderPolicy: false
}));

// CORS - Allow both common Vite ports and LocalTunnel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost origins
    if (allowedOrigins.indexOf(origin) !== -1) {
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

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/config', configRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payment', paymentRoutes);

// Apply stricter rate limit to agendamento creation
app.post('/api/agendamentos', agendamentoLimiter);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  console.log("Serving static files from:", frontendPath);

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

    // For all other routes, serve the SPA index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
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
