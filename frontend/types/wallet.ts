/**
 * Wallet-related types
 */

export interface WalletAddress {
  address: string;
}

export interface WalletVerificationStatus {
  isVerified: boolean;
  requestId: string;
}

export interface WalletVerificationResponse {
  success: boolean;
  message: string;
  requestId: string;
}

