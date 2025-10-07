const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { setupSSE } = require('./sse');
const { setupWebSocket } = require('./websocket');
const { DataGenerator } = require('./utils/dataGenerator');
const { PerformanceMonitor } = require('./utils/performanceMonitor');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5173"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Performance middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control', 
    'Accept', 
    'Accept-Encoding',
    'Accept-Language',
    'Connection',
    'Host',
    'Origin',
    'Referer',
    'User-Agent'
  ],
  exposedHeaders: [
    'Content-Type',
    'Cache-Control', 
    'Connection',
    'Transfer-Encoding'
  ]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitor instance
const performanceMonitor = new PerformanceMonitor();
const dataGenerator = new DataGenerator();

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = performanceMonitor.getStats();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: stats,
    memory: process.memoryUsage()
  });
});

// API endpoints for performance data
app.get('/api/stats', (req, res) => {
  const stats = performanceMonitor.getStats();
  res.json(stats);
});

app.post('/api/simulate/:type', (req, res) => {
  const { type } = req.params;
  const { scenario, duration = 30 } = req.body;
  
  try {
    dataGenerator.startSimulation(type, scenario, duration * 1000);
    res.json({ 
      success: true, 
      message: `Started ${scenario} simulation for ${duration} seconds`,
      type,
      scenario
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/stop-simulation', (req, res) => {
  dataGenerator.stopAllSimulations();
  res.json({ 
    success: true, 
    message: 'All simulations stopped' 
  });
});

// Setup SSE and WebSocket
setupSSE(app, dataGenerator, performanceMonitor);
setupWebSocket(server, dataGenerator, performanceMonitor);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 SSE endpoint: http://localhost:${PORT}/events`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/websocket`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  dataGenerator.stopAllSimulations();
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

module.exports = { app, server };