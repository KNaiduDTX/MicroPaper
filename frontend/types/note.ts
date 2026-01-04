/**
 * Note issuance types
 */

export interface NoteIssuanceRequest {
  walletAddress: string;
  amount: number;
  maturityDate: string; // ISO 8601 format
}

export interface NoteIssuanceResponse {
  isin: string;
  status: string;
  issuedAt: string;
}

