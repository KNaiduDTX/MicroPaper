/**
 * MicroPaper Mock Custodian API Configuration
 * Centralized configuration management with environment variable support
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0'
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
        'http://localhost:3000',
        'https://micropaper-mvp.vercel.app',
        'https://app.micropaper.com'
      ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/api.log',
    console: process.env.NODE_ENV !== 'production'
  },

  // Feature Flags
  features: {
    useMockCustodian: process.env.USE_MOCK_CUSTODIAN === 'true' || true,
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'true' || true
  },

  // Security Configuration
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
  },

  // Business Rules (Corpus Mandates)
  business: {
    unitSize: 10000, // $10,000 minimum unit size
    maxMaturityDays: 270, // Maximum 270 days maturity
    allowedTerms: [90, 180, 270], // Common terms
    isinFormat: {
      countryCode: 'US',
      prefix: 'MOCK',
      length: 12 // ISO 6166 standard
    }
  }
};

module.exports = config;
