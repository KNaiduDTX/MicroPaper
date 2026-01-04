/**
 * Unit tests for validator utilities
 */

const {
  isValidWalletAddress,
  isValidAmount,
  isValidMaturityDate,
  generateMockISIN
} = require('../src/utils/validators');

describe('Validators', () => {
  describe('isValidWalletAddress', () => {
    test('should accept valid lowercase Ethereum address', () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      expect(isValidWalletAddress(address)).toBe(true);
    });

    test('should accept valid uppercase Ethereum address', () => {
      const address = '0x742D35CC6634C0532925A3B8D4C9DB96C4B4D8B6';
      expect(isValidWalletAddress(address)).toBe(true);
    });

    test('should accept valid EIP-55 checksummed address', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      expect(isValidWalletAddress(address)).toBe(true);
    });

    test('should reject invalid address format (too short)', () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8';
      expect(isValidWalletAddress(address)).toBe(false);
    });

    test('should reject invalid address format (too long)', () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6a';
      expect(isValidWalletAddress(address)).toBe(false);
    });

    test('should reject address without 0x prefix', () => {
      const address = '742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      expect(isValidWalletAddress(address)).toBe(false);
    });

    test('should reject address with invalid characters', () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8g6';
      expect(isValidWalletAddress(address)).toBe(false);
    });

    test('should reject null or undefined', () => {
      expect(isValidWalletAddress(null)).toBe(false);
      expect(isValidWalletAddress(undefined)).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(isValidWalletAddress(123)).toBe(false);
      expect(isValidWalletAddress({})).toBe(false);
    });

    test('should reject invalid checksummed address', () => {
      // This address has incorrect checksum
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4D8B6';
      // The checksum validation should catch this
      expect(isValidWalletAddress(address)).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    test('should accept valid amount (multiple of 10000)', () => {
      expect(isValidAmount(10000)).toBe(true);
      expect(isValidAmount(50000)).toBe(true);
      expect(isValidAmount(100000)).toBe(true);
      expect(isValidAmount(1000000)).toBe(true);
    });

    test('should reject amount not multiple of 10000', () => {
      expect(isValidAmount(5000)).toBe(false);
      expect(isValidAmount(15000)).toBe(false);
      expect(isValidAmount(9999)).toBe(false);
      expect(isValidAmount(10001)).toBe(false);
    });

    test('should reject zero or negative amounts', () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-10000)).toBe(false);
      expect(isValidAmount(-1)).toBe(false);
    });

    test('should reject non-number input', () => {
      expect(isValidAmount('10000')).toBe(false);
      expect(isValidAmount(null)).toBe(false);
      expect(isValidAmount(undefined)).toBe(false);
    });
  });

  describe('isValidMaturityDate', () => {
    test('should accept valid maturity date within 270 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      expect(isValidMaturityDate(futureDate.toISOString())).toBe(true);
    });

    test('should accept maturity date exactly 270 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 270);
      expect(isValidMaturityDate(futureDate.toISOString())).toBe(true);
    });

    test('should reject maturity date more than 270 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 271);
      expect(isValidMaturityDate(futureDate.toISOString())).toBe(false);
    });

    test('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isValidMaturityDate(pastDate.toISOString())).toBe(false);
    });

    test('should reject today\'s date', () => {
      const today = new Date();
      expect(isValidMaturityDate(today.toISOString())).toBe(false);
    });

    test('should reject invalid date format', () => {
      expect(isValidMaturityDate('invalid-date')).toBe(false);
      expect(isValidMaturityDate('2024-13-45')).toBe(false);
    });

    test('should reject null or undefined', () => {
      expect(isValidMaturityDate(null)).toBe(false);
      expect(isValidMaturityDate(undefined)).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(isValidMaturityDate(123)).toBe(false);
      expect(isValidMaturityDate({})).toBe(false);
    });
  });

  describe('generateMockISIN', () => {
    test('should generate valid ISIN format', () => {
      const isin = generateMockISIN();
      expect(isin).toMatch(/^USMOCK\d{6}$/);
    });

    test('should generate unique ISINs', () => {
      const isins = new Set();
      for (let i = 0; i < 100; i++) {
        isins.add(generateMockISIN());
      }
      // Should have some unique values (though collisions are possible with random)
      expect(isins.size).toBeGreaterThan(1);
    });

    test('should generate ISIN with correct length', () => {
      const isin = generateMockISIN();
      expect(isin.length).toBe(12);
    });

    test('should start with USMOCK', () => {
      const isin = generateMockISIN();
      expect(isin.startsWith('USMOCK')).toBe(true);
    });
  });
});

