/**
 * Compliance-related types
 */

export interface ComplianceStatus {
  isVerified: boolean;
  requestId: string;
}

export interface ComplianceStats {
  totalWallets: number;
  verifiedWallets: number;
  unverifiedWallets: number;
  verificationRate: string;
  requestId: string;
}

export interface VerifiedWalletsResponse {
  verifiedWallets: string[];
  count: number;
  requestId: string;
}

