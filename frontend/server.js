const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, 'dist');

// Serve static files from dist directory
app.use(express.static(DIST_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA catch-all: serve index.html for all routes
// This allows tenant paths like /empresanova to work
app.get('*', (req, res) => {
  const path = req.path;

  // If it's a static file request (has extension), let it 404 naturally
  if (path.includes('.')) {
    res.status(404).send('Not Found');
    return;
  }

  // For all other routes (including /empresanova, /admin, etc.), serve index.html
  // The frontend JavaScript will handle the routing
  console.log(`📍 Serving index.html for path: ${path}`);
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${DIST_DIR}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
