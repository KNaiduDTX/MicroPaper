/**
 * MicroPaper Mock Custodian API Error Handler
 * Standardized error handling middleware with structured JSON responses
 */

const { logger } = require('../utils/logger');

/**
 * Standardized error response format
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Array} details - Additional error details
 * @param {string} requestId - Request ID for tracing
 * @returns {Object} - Formatted error response
 */
const createErrorResponse = (code, message, details = [], requestId = null) => ({
  error: {
    code,
    message,
    ...(details.length > 0 && { details })
  },
  ...(requestId && { requestId })
});

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, _next) => {
  const requestId = req.requestId || 'unknown';

  // Log error with context
  logger.error('API Error', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Handle Joi validation errors
  if (err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      issue: detail.type,
      message: detail.message
    }));

    return res.status(400).json(createErrorResponse(
      'INVALID_INPUT',
      'Request validation failed',
      details,
      requestId
    ));
  }

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      return res.status(422).json(createErrorResponse(
        'VALIDATION_ERROR',
        err.message,
        [],
        requestId
      ));

    case 'UnauthorizedError':
      return res.status(401).json(createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        [],
        requestId
      ));

    case 'ForbiddenError':
      return res.status(403).json(createErrorResponse(
        'FORBIDDEN',
        'Access denied',
        [],
        requestId
      ));

    case 'NotFoundError':
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        err.message || 'Resource not found',
        [],
        requestId
      ));

    case 'ConflictError':
      return res.status(409).json(createErrorResponse(
        'CONFLICT',
        err.message || 'Resource conflict',
        [],
        requestId
      ));

    default:
      // Generic server error
      return res.status(500).json(createErrorResponse(
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
        [],
        requestId
      ));
  }
};

/**
 * 404 handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  const requestId = req.requestId || 'unknown';

  logger.warn('Route not found', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json(createErrorResponse(
    'NOT_FOUND',
    `Route ${req.method} ${req.url} not found`,
    [],
    requestId
  ));
};

module.exports = {
  errorHandler,
  notFoundHandler,
  createErrorResponse
};
