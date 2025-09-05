/**
 * MicroPaper Mock Compliance Registry
 * In-memory store for wallet verification status
 * 
 * This registry simulates a KYC/AML compliance system that tracks
 * which wallets are "approved" to participate in issuance or trading.
 * 
 * For MVP purposes, this is stored in memory and will reset on server restart.
 * In production, this would be replaced with a real compliance database.
 */

/**
 * In-memory compliance registry
 * Key: wallet address (string)
 * Value: verification status (boolean)
 * 
 * Example state:
 * {
 *   "0xA1b2C3d4E5f6789012345678901234567890abcd": true,  // Verified investor
 *   "0xB2c3D4e5F6789012345678901234567890abcdef": false, // Unverified wallet
 * }
 */
const complianceRegistry = new Map();

/**
 * Get verification status for a wallet address
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {boolean} - Verification status (defaults to false)
 */
const getVerificationStatus = (walletAddress) => {
  return complianceRegistry.get(walletAddress.toLowerCase()) || false;
};

/**
 * Set verification status for a wallet address
 * @param {string} walletAddress - Ethereum wallet address
 * @param {boolean} isVerified - Verification status
 */
const setVerificationStatus = (walletAddress, isVerified) => {
  complianceRegistry.set(walletAddress.toLowerCase(), isVerified);
};

/**
 * Get all verified wallets (for debugging/admin purposes)
 * @returns {Array} - Array of verified wallet addresses
 */
const getVerifiedWallets = () => {
  const verified = [];
  for (const [address, status] of complianceRegistry.entries()) {
    if (status) {
      verified.push(address);
    }
  }
  return verified;
};

/**
 * Get registry statistics (for monitoring)
 * @returns {Object} - Registry statistics
 */
const getRegistryStats = () => {
  let verifiedCount = 0;
  let totalCount = 0;
  
  for (const status of complianceRegistry.values()) {
    totalCount++;
    if (status) verifiedCount++;
  }
  
  return {
    totalWallets: totalCount,
    verifiedWallets: verifiedCount,
    unverifiedWallets: totalCount - verifiedCount,
    verificationRate: totalCount > 0 ? (verifiedCount / totalCount * 100).toFixed(2) + '%' : '0%'
  };
};

/**
 * Clear all verification statuses (for testing/reset purposes)
 */
const clearRegistry = () => {
  complianceRegistry.clear();
};

/**
 * Initialize with some demo wallets (for MVP demonstration)
 */
const initializeDemoWallets = () => {
  // Add some demo wallets for testing
  const demoWallets = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Example from custodian API
    '0xA1b2C3d4E5f6789012345678901234567890abcd', // Demo verified wallet
    '0xB2c3D4e5F6789012345678901234567890abcdef'  // Demo unverified wallet
  ];
  
  // Set first two as verified for demo purposes
  setVerificationStatus(demoWallets[0], true);
  setVerificationStatus(demoWallets[1], true);
  setVerificationStatus(demoWallets[2], false);
  
  console.log('🎭 Demo wallets initialized in compliance registry');
  console.log(`   ✅ Verified: ${demoWallets[0]}`);
  console.log(`   ✅ Verified: ${demoWallets[1]}`);
  console.log(`   ❌ Unverified: ${demoWallets[2]}`);
};

module.exports = {
  complianceRegistry,
  getVerificationStatus,
  setVerificationStatus,
  getVerifiedWallets,
  getRegistryStats,
  clearRegistry,
  initializeDemoWallets
};
