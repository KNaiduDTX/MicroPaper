/**
 * API Request and Response Types
 */

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      issue: string;
      message: string;
    }>;
  };
  requestId: string;
}

// Removed unused type - ApiResponse

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  version: string;
}

export interface ServiceInfoResponse {
  service: string;
  version: string;
  description: string;
  endpoints: Record<string, string>;
  features: Record<string, string>;
}

