/**
 * MicroPaper Mock Custodian API Routes
 * Handles traditional note issuance simulation
 */

const express = require('express');
const { issueNoteSchema, generateMockISIN } = require('../utils/validators');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/mock/custodian/issue
 * Simulates custodian issuing a traditional note when a token is minted
 *
 * Request Body:
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "amount": 100000,
 *   "maturityDate": "2025-06-15T00:00:00.000Z"
 * }
 *
 * Response:
 * {
 *   "isin": "USMOCK12345",
 *   "status": "issued",
 *   "issuedAt": "2024-12-19T16:33:00.000Z"
 * }
 */
router.post('/issue', async (req, res, next) => {
  const requestId = req.requestId;
  const startTime = Date.now();

  try {
    // Validate request body
    const { error, value } = issueNoteSchema.validate(req.body);
    if (error) {
      logger.warn('Validation failed', {
        requestId,
        error: error.details,
        body: req.body
      });
      return next(error);
    }

    const { walletAddress, amount, maturityDate } = value;

    // Log the issuance request
    logger.info('Mock custodian issuance request', {
      requestId,
      walletAddress,
      amount,
      maturityDate,
      timestamp: new Date().toISOString()
    });

    // Generate mock ISIN following ISO 6166 format
    const isin = generateMockISIN();
    const issuedAt = new Date().toISOString();

    // Simulate processing time (realistic for custodian operations)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Prepare response
    const response = {
      isin,
      status: 'issued',
      issuedAt
    };

    // Log successful issuance
    logger.info('Mock custodian issuance completed', {
      requestId,
      isin,
      walletAddress,
      amount,
      maturityDate,
      processingTime: Date.now() - startTime
    });

    // Console log for development visibility (as per requirements)
    console.log(`[MOCK CUSTODIAN] Issuance completed - ISIN: ${isin}, Amount: $${amount.toLocaleString()}, Wallet: ${walletAddress}`);

    res.status(200).json(response);

  } catch (err) {
    logger.error('Mock custodian issuance failed', {
      requestId,
      error: err.message,
      stack: err.stack,
      body: req.body
    });

    next(err);
  }
});

/**
 * GET /api/mock/custodian/health
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'micropaper-mock-custodian',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/mock/custodian/info
 * Service information endpoint
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    service: 'MicroPaper Mock Custodian API',
    version: '1.0.0',
    description: 'Simulates traditional note issuance for dual-format commercial paper',
    endpoints: {
      issue: 'POST /api/mock/custodian/issue',
      health: 'GET /api/mock/custodian/health',
      info: 'GET /api/mock/custodian/info'
    },
    features: {
      isinGeneration: 'ISO 6166 compliant mock ISINs',
      validation: 'Wallet address, amount, and maturity date validation',
      logging: 'Structured logging with request tracing',
      cors: 'Configured for MicroPaper frontend domains'
    }
  });
});

module.exports = router;
