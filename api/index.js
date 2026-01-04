/**
 * Vercel Serverless Function Handler
 * This file is the entry point for Vercel serverless functions
 */

const app = require('../src/server');

// Initialize demo wallets on cold start
const { initializeDemoWallets } = require('../src/utils/registry');
initializeDemoWallets();

// Export the Express app as a serverless function
module.exports = app;

