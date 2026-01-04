/**
 * Validation schemas using Zod
 */

import { z } from 'zod';

// Wallet address validation (Ethereum address)
export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address format');

// Amount validation (must be multiple of $10,000)
export const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .int('Amount must be an integer')
  .refine((val) => val % 10000 === 0, {
    message: 'Amount must be a multiple of $10,000',
  })
  .min(10000, 'Minimum amount is $10,000');

// Maturity date validation (1-270 days from today)
export const maturityDateSchema = z.string().refine(
  (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 1 && daysDiff <= 270;
  },
  {
    message: 'Maturity date must be between 1 and 270 days from today',
  }
);

// Note issuance schema
export const noteIssuanceSchema = z.object({
  walletAddress: walletAddressSchema,
  amount: amountSchema,
  maturityDate: maturityDateSchema,
});

export type NoteIssuanceFormData = z.infer<typeof noteIssuanceSchema>;

