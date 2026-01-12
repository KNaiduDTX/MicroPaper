/**
 * MicroPaper Mock Custodian API Configuration
 * Centralized configuration management with environment variable support
 */

require('dotenv').config();

/**
 * Validate required environment variables at startup
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = () => {
  const missing = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Define required environment variables
  // In production, these are critical for security and functionality
  const requiredVars = isProduction
    ? [
        'NODE_ENV',
        'ALLOWED_ORIGINS' // Required in production for CORS security
      ]
    : [
        'NODE_ENV' // Always required
      ];

  // Check each required variable
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  // Additional production-specific validations
  if (isProduction) {
    // Validate ALLOWED_ORIGINS contains at least one production domain
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (allowedOrigins) {
      const origins = allowedOrigins.split(',').map(o => o.trim());
      const hasProductionDomain = origins.some(origin => 
        origin.startsWith('https://') && !origin.includes('localhost')
      );
      if (!hasProductionDomain) {
        missing.push('ALLOWED_ORIGINS (must include at least one production HTTPS domain)');
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
};

// Validate environment on module load
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  // Don't exit in development, but warn
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

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
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [
        'http://localhost:3000',
        'https://micropaper-mvp.vercel.app',
        'https://micropaper.vercel.app',
        'https://app.micropaper.com'
      ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'X-API-Key', 'X-Request-ID']
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
