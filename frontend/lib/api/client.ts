/**
 * API Client - Centralized HTTP client with error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '@/types/api';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracing
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        config.headers['X-Request-ID'] = requestId;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as { 
        error?: { 
          code?: string; 
          message?: string; 
          details?: Array<{
            field: string;
            issue: string;
            message: string;
          }>;
        }; 
        requestId?: string;
      };
      const apiError: ApiError = {
        error: {
          code: responseData?.error?.code || 'UNKNOWN_ERROR',
          message: responseData?.error?.message || error.message,
          details: responseData?.error?.details,
        },
        requestId: responseData?.requestId || 'unknown',
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received
      const apiError: ApiError = {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error: Unable to reach the server',
        },
        requestId: 'unknown',
      };
      return Promise.reject(apiError);
    } else {
      // Something else happened
      const apiError: ApiError = {
        error: {
          code: 'REQUEST_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
        requestId: 'unknown',
      };
      return Promise.reject(apiError);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

