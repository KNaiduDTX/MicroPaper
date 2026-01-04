/**
 * Vercel Serverless Function Handler
 * This file is the entry point for Vercel serverless functions
 */

let app;

try {
  // Import the Express app
  app = require('../src/server');

  // Initialize demo wallets on cold start
  // Wrap in try-catch to prevent initialization errors from crashing the function
  try {
    const { initializeDemoWallets } = require('../src/utils/registry');
    initializeDemoWallets();
  } catch (initError) {
    console.error('Failed to initialize demo wallets:', initError);
    // Don't throw - allow the function to continue
  }
} catch (error) {
  console.error('Failed to load server:', error);
  // Create a minimal error handler app
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: {
        code: 'INITIALIZATION_ERROR',
        message: 'Server failed to initialize',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  });
}

// Export the Express app as a serverless function
module.exports = app;

