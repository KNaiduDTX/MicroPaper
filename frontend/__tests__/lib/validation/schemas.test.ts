/**
 * Validation schema tests
 */

import { walletAddressSchema, amountSchema, maturityDateSchema, noteIssuanceSchema } from '@/lib/validation/schemas';

describe('walletAddressSchema', () => {
  it('validates correct Ethereum address', () => {
    const result = walletAddressSchema.safeParse('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    expect(result.success).toBe(true);
  });

  it('rejects invalid address format', () => {
    const result = walletAddressSchema.safeParse('invalid-address');
    expect(result.success).toBe(false);
  });

  it('rejects address without 0x prefix', () => {
    const result = walletAddressSchema.safeParse('742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    expect(result.success).toBe(false);
  });
});

describe('amountSchema', () => {
  it('validates multiple of 10000', () => {
    const result = amountSchema.safeParse(100000);
    expect(result.success).toBe(true);
  });

  it('rejects non-multiple of 10000', () => {
    const result = amountSchema.safeParse(15000);
    expect(result.success).toBe(false);
  });

  it('rejects amount less than 10000', () => {
    const result = amountSchema.safeParse(5000);
    expect(result.success).toBe(false);
  });
});

describe('maturityDateSchema', () => {
  it('validates date within 1-270 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const result = maturityDateSchema.safeParse(futureDate.toISOString());
    expect(result.success).toBe(true);
  });

  it('rejects date more than 270 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 300);
    const result = maturityDateSchema.safeParse(futureDate.toISOString());
    expect(result.success).toBe(false);
  });
});

describe('noteIssuanceSchema', () => {
  it('validates complete valid note issuance data', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    
    const result = noteIssuanceSchema.safeParse({
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      amount: 100000,
      maturityDate: futureDate.toISOString(),
    });
    
    expect(result.success).toBe(true);
  });
});

