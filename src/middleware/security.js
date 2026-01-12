/**
 * MicroPaper Mock Custodian API Security Middleware
 * CORS, rate limiting, and security headers
 */

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    // In production, require origin header for security
    // In development, allow requests with no origin for testing
    const isProduction = config.server.env === 'production';
    
    if (!origin) {
      if (isProduction) {
        // Reject requests with no origin in production
        return callback(new Error('CORS: Origin header required in production'));
      }
      // Allow in development for testing tools (curl, Postman, etc.)
      return callback(null, true);
    }

    if (config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Rate limiting configuration
 */
const rateLimitOptions = {
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      },
      requestId: req.requestId
    });
  }
};

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Request timing middleware
 */
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

module.exports = {
  cors: cors(corsOptions),
  rateLimit: config.features.enableRateLimiting ? rateLimit(rateLimitOptions) : (req, res, next) => next(),
  securityHeaders,
  requestTiming
};
