/**
 * MicroPaper Mock Custodian API Validators
 * Input validation utilities following corpus mandates and best practices
 */

const Joi = require('joi');
const config = require('../config');

/**
 * Validate Ethereum wallet address format (EIP-55 checksum)
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - True if valid
 */
const isValidWalletAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  // Basic Ethereum address format: 0x + 40 hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) return false;
  
  // TODO: Add EIP-55 checksum validation for production
  // For MVP, we'll accept any valid hex format
  return true;
};

/**
 * Validate amount is multiple of unit size ($10,000)
 * @param {number} amount - Amount to validate
 * @returns {boolean} - True if valid
 */
const isValidAmount = (amount) => {
  if (typeof amount !== 'number' || amount <= 0) return false;
  return amount % config.business.unitSize === 0;
};

/**
 * Validate maturity date is within allowed range (≤270 days)
 * @param {string} maturityDate - ISO 8601 date string
 * @returns {boolean} - True if valid
 */
const isValidMaturityDate = (maturityDate) => {
  if (!maturityDate || typeof maturityDate !== 'string') return false;
  
  try {
    const maturity = new Date(maturityDate);
    const now = new Date();
    const daysDiff = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
    
    return daysDiff > 0 && daysDiff <= config.business.maxMaturityDays;
  } catch (error) {
    return false;
  }
};

/**
 * Generate mock ISIN following ISO 6166 format (12 characters)
 * Format: US + MOCK + 5-digit number + check digit
 * @returns {string} - Mock ISIN
 */
const generateMockISIN = () => {
  const { countryCode, prefix } = config.business.isinFormat;
  const randomNumber = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
  const checkDigit = Math.floor(Math.random() * 10); // Simple check digit for mock
  
  return `${countryCode}${prefix}${randomNumber}${checkDigit}`;
};

// Joi schemas for request validation
const issueNoteSchema = Joi.object({
  walletAddress: Joi.string()
    .custom((value, helpers) => {
      if (!isValidWalletAddress(value)) {
        return helpers.error('walletAddress.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.required': 'Wallet address is required',
      'walletAddress.invalid': 'Invalid wallet address format'
    }),
    
  amount: Joi.number()
    .integer()
    .positive()
    .custom((value, helpers) => {
      if (!isValidAmount(value)) {
        return helpers.error('amount.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.required': 'Amount is required',
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'amount.invalid': `Amount must be a multiple of $${config.business.unitSize.toLocaleString()}`
    }),
    
  maturityDate: Joi.string()
    .isoDate()
    .custom((value, helpers) => {
      if (!isValidMaturityDate(value)) {
        return helpers.error('maturityDate.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.required': 'Maturity date is required',
      'string.isoDate': 'Maturity date must be in ISO 8601 format',
      'maturityDate.invalid': `Maturity date must be within ${config.business.maxMaturityDays} days from today`
    })
});

module.exports = {
  isValidWalletAddress,
  isValidAmount,
  isValidMaturityDate,
  generateMockISIN,
  issueNoteSchema
};
