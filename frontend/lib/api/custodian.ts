/**
 * Custodian API methods
 */

import apiClient from './client';
import { NoteIssuanceRequest, NoteIssuanceResponse } from '@/types/note';
import { HealthCheckResponse, ServiceInfoResponse } from '@/types/api';

export interface NoteIssuance {
  id: number;
  isin: string;
  wallet_address: string;
  amount: number;
  maturity_date: string;
  status: string;
  issued_at: string;
  created_at: string;
}

export interface GetNotesParams {
  wallet_address?: string;
  limit?: number;
}

export const custodianApi = {
  /**
   * Issue a traditional note
   */
  async issueNote(data: NoteIssuanceRequest): Promise<NoteIssuanceResponse> {
    return apiClient.post<NoteIssuanceResponse>('/api/mock/custodian/issue', data);
  },

  /**
   * Get list of note issuances
   */
  async getNotes(params?: GetNotesParams): Promise<NoteIssuance[]> {
    const queryParams = new URLSearchParams();
    if (params?.wallet_address) {
      queryParams.append('wallet_address', params.wallet_address);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    const queryString = queryParams.toString();
    const url = `/api/mock/custodian/notes${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<NoteIssuance[]>(url);
  },

  /**
   * Get custodian service health status
   */
  async getHealth(): Promise<HealthCheckResponse> {
    return apiClient.get<HealthCheckResponse>('/api/mock/custodian/health');
  },

  /**
   * Get custodian service information
   */
  async getInfo(): Promise<ServiceInfoResponse> {
    return apiClient.get<ServiceInfoResponse>('/api/mock/custodian/info');
  },
};

