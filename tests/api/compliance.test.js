/**
 * Integration tests for Mock Compliance API endpoints
 */

const request = require('supertest');
const app = require('../../src/server');
const { clearRegistry, setVerificationStatus } = require('../../src/utils/registry');

describe('Mock Compliance API', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearRegistry();
  });

  describe('GET /api/mock/compliance/:walletAddress', () => {
    test('should return false for unverified wallet', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';

      const response = await request(app)
        .get(`/api/mock/compliance/${walletAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('isVerified', false);
      expect(response.body).toHaveProperty('requestId');
    });

    test('should return true for verified wallet', async () => {
      const walletAddress = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      setVerificationStatus(walletAddress, true);

      const response = await request(app)
        .get(`/api/mock/compliance/${walletAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('isVerified', true);
      expect(response.body).toHaveProperty('requestId');
    });

    test('should reject invalid wallet address', async () => {
      const response = await request(app)
        .get('/api/mock/compliance/invalid-address')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_WALLET_ADDRESS');
    });

    test('should handle wallet address case insensitivity', async () => {
      const walletAddress = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      const upperCaseAddress = '0x742D35CC6634C0532925A3B8D4C9DB96C4B4D8B6';

      setVerificationStatus(walletAddress, true);

      const response = await request(app)
        .get(`/api/mock/compliance/${upperCaseAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('isVerified', true);
    });
  });

  describe('POST /api/mock/compliance/verify/:walletAddress', () => {
    test('should verify a wallet address', async () => {
      const walletAddress = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';

      const response = await request(app)
        .post(`/api/mock/compliance/verify/${walletAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('requestId');

      // Verify the wallet is actually verified
      const checkResponse = await request(app)
        .get(`/api/mock/compliance/${walletAddress}`)
        .expect(200);

      expect(checkResponse.body.isVerified).toBe(true);
    });

    test('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/mock/compliance/verify/invalid-address')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_WALLET_ADDRESS');
    });
  });

  describe('POST /api/mock/compliance/unverify/:walletAddress', () => {
    test('should unverify a wallet address', async () => {
      const walletAddress = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      setVerificationStatus(walletAddress, true);

      const response = await request(app)
        .post(`/api/mock/compliance/unverify/${walletAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('requestId');

      // Verify the wallet is actually unverified
      const checkResponse = await request(app)
        .get(`/api/mock/compliance/${walletAddress}`)
        .expect(200);

      expect(checkResponse.body.isVerified).toBe(false);
    });

    test('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/mock/compliance/unverify/invalid-address')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_WALLET_ADDRESS');
    });
  });

  describe('GET /api/mock/compliance/stats', () => {
    test('should return registry statistics', async () => {
      const response = await request(app)
        .get('/api/mock/compliance/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalWallets');
      expect(response.body).toHaveProperty('verifiedWallets');
      expect(response.body).toHaveProperty('unverifiedWallets');
      expect(response.body).toHaveProperty('verificationRate');
      expect(response.body).toHaveProperty('requestId');
    });

    test('should reflect correct statistics after verification', async () => {
      const walletAddress = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';

      // Initially should have 0 verified
      let response = await request(app)
        .get('/api/mock/compliance/stats')
        .expect(200);

      expect(response.body.verifiedWallets).toBe(0);

      // Verify wallet
      await request(app)
        .post(`/api/mock/compliance/verify/${walletAddress}`)
        .expect(200);

      // Check stats again
      response = await request(app)
        .get('/api/mock/compliance/stats')
        .expect(200);

      expect(response.body.verifiedWallets).toBe(1);
      expect(response.body.totalWallets).toBe(1);
    });
  });

  describe('GET /api/mock/compliance/verified', () => {
    test('should return list of verified wallets', async () => {
      const response = await request(app)
        .get('/api/mock/compliance/verified')
        .expect(200);

      expect(response.body).toHaveProperty('verifiedWallets');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('requestId');
      expect(Array.isArray(response.body.verifiedWallets)).toBe(true);
    });

    test('should include verified wallets in list', async () => {
      const walletAddress = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';

      await request(app)
        .post(`/api/mock/compliance/verify/${walletAddress}`)
        .expect(200);

      const response = await request(app)
        .get('/api/mock/compliance/verified')
        .expect(200);

      expect(response.body.verifiedWallets).toContain(walletAddress.toLowerCase());
      expect(response.body.count).toBe(1);
    });
  });

  describe('GET /api/mock/compliance/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/mock/compliance/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'micropaper-mock-compliance');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/mock/compliance/info', () => {
    test('should return service information', async () => {
      const response = await request(app)
        .get('/api/mock/compliance/info')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('features');
    });
  });
});

