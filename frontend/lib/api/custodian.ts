/**
 * Custodian API methods
 */

import apiClient from './client';
import { NoteIssuanceRequest, NoteIssuanceResponse } from '@/types/note';
import { HealthCheckResponse, ServiceInfoResponse } from '@/types/api';

export const custodianApi = {
  /**
   * Issue a traditional note
   */
  async issueNote(data: NoteIssuanceRequest): Promise<NoteIssuanceResponse> {
    return apiClient.post<NoteIssuanceResponse>('/api/mock/custodian/issue', data);
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

