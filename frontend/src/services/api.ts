/**
 * SevAIQ API Client Service
 * Configurable base URL with resilient error handling.
 */

import { HealthResponse, Scheme } from '../types';

export const getApiBaseUrl = (): string => {
  // Configurable via Vite environment variable, fallback to local FastAPI default
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredUrl && typeof configuredUrl === 'string' && configuredUrl.trim() !== '') {
    return configuredUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:8000';
};

export interface HealthCheckResult {
  success: boolean;
  data: HealthResponse | null;
  latencyMs: number;
  error?: string;
}

/**
 * Checks connectivity and health status of the FastAPI backend.
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const baseUrl = getApiBaseUrl();
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return {
        success: false,
        data: null,
        latencyMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data: HealthResponse = await response.json();
    return {
      success: true,
      data,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    let message = 'Network connection failed';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Connection timed out (4s)';
    } else if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      data: null,
      latencyMs,
      error: message,
    };
  }
}

/**
 * Retrieves verified schemes from the backend.
 * Initially returns an empty list until official schemes are verified.
 */
export async function fetchSchemes(): Promise<{ success: boolean; data: Scheme[]; error?: string }> {
  const baseUrl = getApiBaseUrl();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/schemes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        data: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data as Scheme[],
      };
    }
    return {
      success: true,
      data: [],
    };
  } catch (err: unknown) {
    let message = 'Failed to fetch schemes';
    if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      data: [],
      error: message,
    };
  }
}
