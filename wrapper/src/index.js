const express = require('express');
const multer = require('multer');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const sendRouter = require('./routes/send');
const groupsRouter = require('./routes/groups');
const receiveRouter = require('./routes/receive');
const contactsRouter = require('./routes/contacts');
const qrcodeRouter = require('./routes/qrcode');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: config.maxFileSize }
});

// Create uploads directory
const fs = require('fs');
if (!fs.existsSync('/tmp/uploads')) {
  fs.mkdirSync('/tmp/uploads', { recursive: true });
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/send', upload.single('media'), sendRouter);
app.use('/groups', groupsRouter);
app.use('/receive', receiveRouter);
app.use('/contacts', contactsRouter);
app.use('/qrcode', qrcodeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    signalNumber: config.signalNumber ? 'configured' : 'not configured'
  });
});

// Get queue status
app.get('/status', (req, res) => {
  const { getQueueStatus } = require('./utils/throttle');
  res.json({
    status: 'ok',
    queue: getQueueStatus(),
    config: {
      signalNumber: config.signalNumber ? `${config.signalNumber.slice(0, 4)}...` : 'not set',
      rateLimitDelayMs: config.rateLimitDelayMs,
      signalApiUrl: config.signalApiUrl
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: `File too large. Maximum size is ${config.maxFileSize / (1024 * 1024)}MB` 
      });
    }
  }
  
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /send - Send messages',
      'GET /health - Health check',
      'GET /status - Queue status',
      'GET /groups - List groups',
      'POST /groups - Create group',
      'GET /receive - Get incoming messages',
      'GET /contacts - List contacts',
      'GET /qrcode - Get QR code for linking devices'
    ]
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Signal API Wrapper started`, {
    port: config.port,
    signalApiUrl: config.signalApiUrl,
    signalNumber: config.signalNumber ? 'configured' : 'not configured'
  });
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Signal API Wrapper Started Successfully          ║
╠════════════════════════════════════════════════════════════╣
║  API URL:        http://localhost:${config.port}                    ║
║  Signal API:     ${config.signalApiUrl.padEnd(38)}║
║  Signal Number:  ${(config.signalNumber || 'NOT SET').padEnd(38)}║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    POST /send     - Send messages to users/groups          ║
║    GET  /health   - Health check                           ║
║    GET  /status   - Queue and config status                ║
║    GET  /groups   - List all groups                        ║
║    POST /groups   - Create a new group                     ║
║    GET  /receive  - Get incoming messages                  ║
║    GET  /contacts - List contacts                          ║
║    GET  /qrcode   - Get QR code for linking devices        ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

