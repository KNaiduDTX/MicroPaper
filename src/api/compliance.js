/**
 * MicroPaper Mock Compliance API Routes
 * Handles wallet verification status checks and manual verification
 */

const express = require('express');
const { logger } = require('../utils/logger');
const {
  getVerificationStatus,
  setVerificationStatus,
  getRegistryStats,
  getVerifiedWallets
} = require('../utils/registry');
const { validateWalletAddress } = require('../middleware/walletValidator');

const router = express.Router();

/**
 * GET /api/mock/compliance/stats
 * Get compliance registry statistics (admin/debugging)
 *
 * Response:
 * {
 *   "totalWallets": 5,
 *   "verifiedWallets": 2,
 *   "unverifiedWallets": 3,
 *   "verificationRate": "40.00%",
 *   "requestId": "req_mno345"
 * }
 */
router.get('/stats', async (req, res, next) => {
  const requestId = req.requestId;

  try {
    // Get registry statistics
    const stats = getRegistryStats();

    // Log stats access for audit trail
    logger.info('Compliance stats accessed', {
      requestId,
      action: 'get_stats',
      stats,
      timestamp: new Date().toISOString()
    });

    // Return statistics
    res.status(200).json({
      ...stats,
      requestId
    });

  } catch (err) {
    logger.error('Failed to get compliance stats', {
      requestId,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

/**
 * GET /api/mock/compliance/verified
 * Get list of all verified wallets (admin/debugging)
 *
 * Response:
 * {
 *   "verifiedWallets": ["0x...", "0x..."],
 *   "count": 2,
 *   "requestId": "req_pqr678"
 * }
 */
router.get('/verified', async (req, res, next) => {
  const requestId = req.requestId;

  try {
    // Get verified wallets list
    const verifiedWallets = getVerifiedWallets();

    // Log verified wallets access for audit trail
    logger.info('Verified wallets list accessed', {
      requestId,
      action: 'get_verified_wallets',
      count: verifiedWallets.length,
      timestamp: new Date().toISOString()
    });

    // Return verified wallets
    res.status(200).json({
      verifiedWallets,
      count: verifiedWallets.length,
      requestId
    });

  } catch (err) {
    logger.error('Failed to get verified wallets', {
      requestId,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

/**
 * GET /api/mock/compliance/health
 * Health check endpoint for compliance service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'micropaper-mock-compliance',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/mock/compliance/info
 * Service information endpoint
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    service: 'MicroPaper Mock Compliance API',
    version: '1.0.0',
    description: 'Simulates KYC/AML compliance registry for wallet verification',
    endpoints: {
      checkStatus: 'GET /api/mock/compliance/:walletAddress',
      verifyWallet: 'POST /api/mock/compliance/verify/:walletAddress',
      unverifyWallet: 'POST /api/mock/compliance/unverify/:walletAddress',
      getStats: 'GET /api/mock/compliance/stats',
      getVerified: 'GET /api/mock/compliance/verified',
      health: 'GET /api/mock/compliance/health',
      info: 'GET /api/mock/compliance/info'
    },
    features: {
      inMemoryStorage: 'Wallet verification status stored in memory',
      auditLogging: 'All compliance actions logged for audit trail',
      adminControls: 'Manual verification/unverification for demo purposes',
      statistics: 'Registry statistics and verified wallet lists'
    }
  });
});

/**
 * GET /api/mock/compliance/:walletAddress
 * Check verification status for a wallet address
 *
 * Path Parameters:
 * - walletAddress: Ethereum wallet address
 *
 * Response:
 * {
 *   "isVerified": true/false,
 *   "requestId": "req_abc123"
 * }
 */
router.get('/:walletAddress', validateWalletAddress, async (req, res, next) => {
  const requestId = req.requestId;
  const walletAddress = req.normalizedWalletAddress;
  const originalWalletAddress = req.params.walletAddress;

  try {
    // Get verification status from registry
    const isVerified = getVerificationStatus(walletAddress);

    // Log compliance check for audit trail
    logger.info('Compliance check performed', {
      requestId,
      walletAddress: originalWalletAddress,
      normalizedWalletAddress: walletAddress,
      isVerified,
      action: 'check_status',
      timestamp: new Date().toISOString()
    });

    // Console log for development visibility
    console.log(`[MOCK COMPLIANCE] Status check - Wallet: ${originalWalletAddress}, Verified: ${isVerified}`);

    // Return verification status
    res.status(200).json({
      isVerified,
      requestId
    });

  } catch (err) {
    logger.error('Compliance check failed', {
      requestId,
      walletAddress: originalWalletAddress,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

/**
 * POST /api/mock/compliance/verify/:walletAddress
 * Manually verify a wallet address (admin/demo use)
 *
 * Path Parameters:
 * - walletAddress: Ethereum wallet address
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Wallet 0x... marked as verified",
 *   "requestId": "req_ghi789"
 * }
 */
router.post('/verify/:walletAddress', validateWalletAddress, async (req, res, next) => {
  const requestId = req.requestId;
  const walletAddress = req.normalizedWalletAddress;
  const originalWalletAddress = req.params.walletAddress;

  try {
    // Set wallet as verified in registry
    setVerificationStatus(walletAddress, true);

    // Log verification action for audit trail
    logger.info('Wallet manually verified', {
      requestId,
      walletAddress: originalWalletAddress,
      normalizedWalletAddress: walletAddress,
      action: 'manual_verification',
      verifiedBy: 'admin_demo',
      timestamp: new Date().toISOString()
    });

    // Console log for development visibility
    console.log(`[MOCK COMPLIANCE] Manual verification - Wallet: ${originalWalletAddress} marked as verified`);

    // Return success response
    res.status(200).json({
      success: true,
      message: `Wallet ${originalWalletAddress} marked as verified`,
      requestId
    });

  } catch (err) {
    logger.error('Wallet verification failed', {
      requestId,
      walletAddress: originalWalletAddress,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

/**
 * POST /api/mock/compliance/unverify/:walletAddress
 * Manually unverify a wallet address (admin/demo use)
 *
 * Path Parameters:
 * - walletAddress: Ethereum wallet address
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Wallet 0x... marked as unverified",
 *   "requestId": "req_jkl012"
 * }
 */
router.post('/unverify/:walletAddress', validateWalletAddress, async (req, res, next) => {
  const requestId = req.requestId;
  const walletAddress = req.normalizedWalletAddress;
  const originalWalletAddress = req.params.walletAddress;

  try {
    // Set wallet as unverified in registry
    setVerificationStatus(walletAddress, false);

    // Log unverification action for audit trail
    logger.info('Wallet manually unverified', {
      requestId,
      walletAddress: originalWalletAddress,
      normalizedWalletAddress: walletAddress,
      action: 'manual_unverification',
      unverifiedBy: 'admin_demo',
      timestamp: new Date().toISOString()
    });

    // Console log for development visibility
    console.log(`[MOCK COMPLIANCE] Manual unverification - Wallet: ${originalWalletAddress} marked as unverified`);

    // Return success response
    res.status(200).json({
      success: true,
      message: `Wallet ${originalWalletAddress} marked as unverified`,
      requestId
    });

  } catch (err) {
    logger.error('Wallet unverification failed', {
      requestId,
      walletAddress: originalWalletAddress,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

module.exports = router;
