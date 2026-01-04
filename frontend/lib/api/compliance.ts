/**
 * Compliance API methods
 */

import apiClient from './client';
import { ComplianceStatus, ComplianceStats, VerifiedWalletsResponse } from '@/types/compliance';
import { WalletVerificationResponse } from '@/types/wallet';
import { HealthCheckResponse, ServiceInfoResponse } from '@/types/api';

export const complianceApi = {
  /**
   * Check wallet verification status
   */
  async checkStatus(walletAddress: string): Promise<ComplianceStatus> {
    return apiClient.get<ComplianceStatus>(`/api/mock/compliance/${walletAddress}`);
  },

  /**
   * Verify a wallet address
   */
  async verifyWallet(walletAddress: string): Promise<WalletVerificationResponse> {
    return apiClient.post<WalletVerificationResponse>(
      `/api/mock/compliance/verify/${walletAddress}`
    );
  },

  /**
   * Unverify a wallet address
   */
  async unverifyWallet(walletAddress: string): Promise<WalletVerificationResponse> {
    return apiClient.post<WalletVerificationResponse>(
      `/api/mock/compliance/unverify/${walletAddress}`
    );
  },

  /**
   * Get compliance statistics
   */
  async getStats(): Promise<ComplianceStats> {
    return apiClient.get<ComplianceStats>('/api/mock/compliance/stats');
  },

  /**
   * Get list of verified wallets
   */
  async getVerifiedWallets(): Promise<VerifiedWalletsResponse> {
    return apiClient.get<VerifiedWalletsResponse>('/api/mock/compliance/verified');
  },

  /**
   * Get compliance service health status
   */
  async getHealth(): Promise<HealthCheckResponse> {
    return apiClient.get<HealthCheckResponse>('/api/mock/compliance/health');
  },

  /**
   * Get compliance service information
   */
  async getInfo(): Promise<ServiceInfoResponse> {
    return apiClient.get<ServiceInfoResponse>('/api/mock/compliance/info');
  },
};

