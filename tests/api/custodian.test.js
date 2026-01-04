/**
 * Integration tests for Mock Custodian API endpoints
 */

const request = require('supertest');
const app = require('../../src/server');

describe('Mock Custodian API', () => {
  describe('POST /api/mock/custodian/issue', () => {
    test('should issue a note with valid request', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const response = await request(app)
        .post('/api/mock/custodian/issue')
        .send({
          walletAddress: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          amount: 100000,
          maturityDate: futureDate.toISOString()
        })
        .expect(200);

      expect(response.body).toHaveProperty('isin');
      expect(response.body).toHaveProperty('status', 'issued');
      expect(response.body).toHaveProperty('issuedAt');
      expect(response.body.isin).toMatch(/^USMOCK\d{6}$/);
    });

    test('should reject request with invalid wallet address', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const response = await request(app)
        .post('/api/mock/custodian/issue')
        .send({
          walletAddress: 'invalid-address',
          amount: 100000,
          maturityDate: futureDate.toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('should reject request with amount not multiple of 10000', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const response = await request(app)
        .post('/api/mock/custodian/issue')
        .send({
          walletAddress: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          amount: 15000,
          maturityDate: futureDate.toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('should reject request with maturity date too far in future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 271);

      const response = await request(app)
        .post('/api/mock/custodian/issue')
        .send({
          walletAddress: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          amount: 100000,
          maturityDate: futureDate.toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('should reject request with past maturity date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/mock/custodian/issue')
        .send({
          walletAddress: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          amount: 100000,
          maturityDate: pastDate.toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('should reject request with missing required fields', async () => {
      const response = await request(app)
        .post('/api/mock/custodian/issue')
        .send({
          walletAddress: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /api/mock/custodian/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/mock/custodian/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'micropaper-mock-custodian');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/mock/custodian/info', () => {
    test('should return service information', async () => {
      const response = await request(app)
        .get('/api/mock/custodian/info')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('features');
    });
  });
});

