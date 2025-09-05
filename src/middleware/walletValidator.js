/**
 * MicroPaper Mock Compliance API - Wallet Address Validation Middleware
 * Validates Ethereum wallet addresses for compliance endpoints
 */

const { isValidWalletAddress } = require('../utils/validators');
const { createErrorResponse } = require('./errorHandler');

/**
 * Middleware to validate wallet address in URL parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateWalletAddress = (req, res, next) => {
  const { walletAddress } = req.params;
  const requestId = req.requestId || 'unknown';
  
  // Check if wallet address is provided
  if (!walletAddress) {
    return res.status(400).json(createErrorResponse(
      'INVALID_WALLET_ADDRESS',
      'Wallet address is required',
      [],
      requestId
    ));
  }
  
  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json(createErrorResponse(
      'INVALID_WALLET_ADDRESS',
      'Wallet address must be a valid Ethereum address (0x + 40 hex characters)',
      [{
        field: 'walletAddress',
        issue: 'invalid_format',
        message: 'Invalid Ethereum address format'
      }],
      requestId
    ));
  }
  
  // Add normalized wallet address to request for consistency
  req.normalizedWalletAddress = walletAddress.toLowerCase();
  
  next();
};

/**
 * Middleware to validate wallet address in request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateWalletAddressInBody = (req, res, next) => {
  const { walletAddress } = req.body;
  const requestId = req.requestId || 'unknown';
  
  // Check if wallet address is provided
  if (!walletAddress) {
    return res.status(400).json(createErrorResponse(
      'INVALID_WALLET_ADDRESS',
      'Wallet address is required in request body',
      [],
      requestId
    ));
  }
  
  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json(createErrorResponse(
      'INVALID_WALLET_ADDRESS',
      'Wallet address must be a valid Ethereum address (0x + 40 hex characters)',
      [{
        field: 'walletAddress',
        issue: 'invalid_format',
        message: 'Invalid Ethereum address format'
      }],
      requestId
    ));
  }
  
  // Add normalized wallet address to request for consistency
  req.normalizedWalletAddress = walletAddress.toLowerCase();
  
  next();
};

module.exports = {
  validateWalletAddress,
  validateWalletAddressInBody
};
