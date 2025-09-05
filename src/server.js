/**
 * MicroPaper Mock Custodian API Server
 * Express.js server for simulating traditional note issuance
 */

const express = require('express');
const config = require('./config');
const { logger, logRequest, logResponse } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { cors, rateLimit, securityHeaders, requestTiming } = require('./middleware/security');

// Import API routes
const custodianRoutes = require('./api/custodian');
const complianceRoutes = require('./api/compliance');

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses (important for Vercel deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(cors);
app.use(rateLimit);

// Request timing and logging
app.use(requestTiming);
app.use(logRequest);
app.use(logResponse);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/mock/custodian', custodianRoutes);
app.use('/api/mock/compliance', complianceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'MicroPaper Mock Custodian API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      custodian: {
        issue: 'POST /api/mock/custodian/issue',
        health: 'GET /api/mock/custodian/health',
        info: 'GET /api/mock/custodian/info'
      },
      compliance: {
        checkStatus: 'GET /api/mock/compliance/:walletAddress',
        verifyWallet: 'POST /api/mock/compliance/verify/:walletAddress',
        unverifyWallet: 'POST /api/mock/compliance/unverify/:walletAddress',
        getStats: 'GET /api/mock/compliance/stats',
        getVerified: 'GET /api/mock/compliance/verified',
        health: 'GET /api/mock/compliance/health',
        info: 'GET /api/mock/compliance/info'
      }
    },
    documentation: 'https://github.com/micropaper/mock-custodian-api'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.server.env
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize demo data
const { initializeDemoWallets } = require('./utils/registry');

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('MicroPaper Mock Custodian API started', {
    port: config.server.port,
    host: config.server.host,
    environment: config.server.env,
    nodeVersion: process.version,
    pid: process.pid
  });
  
  console.log(`🚀 MicroPaper Mock Custodian API running on http://${config.server.host}:${config.server.port}`);
  console.log(`📋 Environment: ${config.server.env}`);
  console.log(`🔗 Custodian endpoint: POST http://${config.server.host}:${config.server.port}/api/mock/custodian/issue`);
  console.log(`🔗 Compliance endpoint: GET http://${config.server.host}:${config.server.port}/api/mock/compliance/:walletAddress`);
  
  // Initialize demo wallets for compliance registry
  initializeDemoWallets();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;
