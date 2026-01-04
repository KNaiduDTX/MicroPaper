/**
 * MicroPaper Mock Custodian API Logger
 * Structured logging with Winston for audit trails and debugging
 */

const winston = require('winston');
const path = require('path');
const config = require('../config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      ts: timestamp,
      level,
      msg: message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'micropaper-mock-custodian' },
  transports: [
    // File transport for persistent logging
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for development
if (config.logging.console) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper functions for structured logging
const logRequest = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || require('uuid').v4();
  req.requestId = requestId;

  logger.info('Request received', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  next();
};

const logResponse = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    logger.info('Response sent', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime
    });

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  logger,
  logRequest,
  logResponse
};
