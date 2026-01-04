/**
 * API Client - Centralized HTTP client with error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '@/types/api';

/**
 * Validate required environment variables at startup
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = () => {
  const pythonServiceUrl = process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || process.env.PYTHON_SERVICE_URL;
  const pythonApiKey = process.env.NEXT_PUBLIC_PYTHON_API_KEY || process.env.PYTHON_API_KEY;

  // In production, require Python service configuration
  if (process.env.NODE_ENV === 'production') {
    if (!pythonServiceUrl) {
      throw new Error(
        'Missing required environment variable: PYTHON_SERVICE_URL or NEXT_PUBLIC_PYTHON_SERVICE_URL\n' +
        'Please set this in your Vercel environment variables.'
      );
    }
    if (!pythonApiKey) {
      throw new Error(
        'Missing required environment variable: PYTHON_API_KEY or NEXT_PUBLIC_PYTHON_API_KEY\n' +
        'Please set this in your Vercel environment variables.'
      );
    }
  }

  // In development, warn if not set but allow fallback
  if (process.env.NODE_ENV === 'development' && !pythonServiceUrl) {
    console.warn(
      '⚠️  PYTHON_SERVICE_URL not set. Falling back to NEXT_PUBLIC_API_URL or localhost.\n' +
      'Set PYTHON_SERVICE_URL in .env.local for Python service integration.'
    );
  }
};

// Validate environment on module load
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error.message : String(error));
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string | null;

  constructor() {
    // Prefer Python service URL, fallback to legacy API URL, then localhost
    this.baseURL = 
      process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 
      process.env.PYTHON_SERVICE_URL ||
      process.env.NEXT_PUBLIC_API_URL || 
      'http://localhost:3001';
    
    // Get API key (prefer public env var for client-side access)
    this.apiKey = 
      process.env.NEXT_PUBLIC_PYTHON_API_KEY || 
      process.env.PYTHON_API_KEY || 
      null;

    // Warn if API key is missing in production
    if (process.env.NODE_ENV === 'production' && !this.apiKey) {
      console.warn('⚠️  PYTHON_API_KEY not set. API calls may fail authentication.');
    }
    
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
        
        // Add API key header if available
        if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle retries for network/5xx errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        // Helper function to check if an error is retryable
        const isRetryableError = (err: AxiosError): boolean => {
          // Retry on network errors (no response) or 5xx server errors
          return !err.response || (err.response.status >= 500 && err.response.status < 600);
        };

        // Only retry if error is retryable and we have a config
        if (!error.config || !isRetryableError(error)) {
          const apiError = this.handleError(error);
          return Promise.reject(apiError);
        }

        const config = error.config;
        const maxRetries = 3;
        let retryCount = 0;
        let lastError: AxiosError = error;

        while (retryCount < maxRetries) {
          // Calculate exponential backoff delay: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            const response = await this.client.request(config);
            // Return the full AxiosResponse object so the HTTP methods can extract .data
            // This maintains consistency with normal (non-retry) request flow
            return response;
          } catch (retryError) {
            // Capture the current retry error
            const currentRetryError = retryError as AxiosError;
            lastError = currentRetryError;
            retryCount++;
            
            // Check if the current retry error is still retryable
            // If not (e.g., 4xx error), stop retrying immediately
            if (!isRetryableError(currentRetryError)) {
              break;
            }
            
            // If max retries reached, stop
            if (retryCount >= maxRetries) {
              break;
            }
          }
        }
        
        // Handle error (either no retry needed, retries exhausted, or non-retryable error encountered)
        // Use the most recent error from retries
        const apiError = this.handleError(lastError);
        return Promise.reject(apiError);
      }
    );
  }

  private handleError(error: AxiosError | ApiError): ApiError {
    // If error is already an ApiError (from interceptor), return it directly
    if ('error' in error && 'requestId' in error) {
      return error as ApiError;
    }

    // Otherwise, it's an AxiosError - convert it to ApiError
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // Server responded with error status
      const responseData = axiosError.response.data as { 
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
      return {
        error: {
          code: responseData?.error?.code || 'UNKNOWN_ERROR',
          message: responseData?.error?.message || axiosError.message,
          details: responseData?.error?.details,
        },
        requestId: responseData?.requestId || 'unknown',
      };
    } else if (axiosError.request) {
      // Request made but no response received
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error: Unable to reach the server',
        },
        requestId: 'unknown',
      };
    } else {
      // Something else happened
      return {
        error: {
          code: 'REQUEST_ERROR',
          message: axiosError.message || 'An unexpected error occurred',
        },
        requestId: 'unknown',
      };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Interceptor handles all errors and converts them to ApiError
    // No need to catch here - let the promise reject naturally
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Interceptor handles all errors and converts them to ApiError
    // No need to catch here - let the promise reject naturally
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Interceptor handles all errors and converts them to ApiError
    // No need to catch here - let the promise reject naturally
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Interceptor handles all errors and converts them to ApiError
    // No need to catch here - let the promise reject naturally
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

