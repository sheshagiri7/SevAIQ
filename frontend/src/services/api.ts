/**
 * SevAIQ API Client Service
 * 
 * Configurable base URL with robust error handling for FastAPI error envelopes ({ detail: ... }),
 * network interruptions, malformed JSON, and request timeouts.
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
 * Extracts descriptive error messages from FastAPI responses.
 * Supports standard FastAPI error envelopes:
 * - { "detail": "string error message" }
 * - { "detail": [ { "msg": "...", "loc": [...] } ] } (validation errors)
 * - Plaintext or HTML fallback
 */
export async function extractApiErrorMessage(response: Response): Promise<string> {
  const statusInfo = `HTTP ${response.status}${response.statusText ? ` (${response.statusText})` : ''}`;

  try {
    const rawText = await response.text();
    if (!rawText || rawText.trim() === '') {
      return statusInfo;
    }

    try {
      const parsed = JSON.parse(rawText);

      // 1. Standard FastAPI string detail: { "detail": "..." }
      if (parsed && typeof parsed.detail === 'string') {
        return `${parsed.detail} [${statusInfo}]`;
      }

      // 2. FastAPI validation error array: { "detail": [ { "msg": "...", "loc": [...] } ] }
      if (parsed && Array.isArray(parsed.detail)) {
        const issues = parsed.detail.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && item.msg) {
            const field = Array.isArray(item.loc) ? ` (${item.loc.slice(1).join('.')})` : '';
            return `${item.msg}${field}`;
          }
          return JSON.stringify(item);
        });
        return `${issues.join('; ')} [${statusInfo}]`;
      }

      // 3. Generic JSON message/error field
      if (parsed && typeof parsed.message === 'string') {
        return `${parsed.message} [${statusInfo}]`;
      }
      if (parsed && typeof parsed.error === 'string') {
        return `${parsed.error} [${statusInfo}]`;
      }
    } catch {
      // Non-JSON response (e.g. proxy or gateway error page)
      if (rawText.length < 160) {
        return `${rawText.trim()} [${statusInfo}]`;
      }
    }
  } catch {
    // If stream reading failed
  }

  return statusInfo;
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
      const errorMessage = await extractApiErrorMessage(response);
      return {
        success: false,
        data: null,
        latencyMs,
        error: errorMessage,
      };
    }

    try {
      const data: HealthResponse = await response.json();
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          data: null,
          latencyMs,
          error: 'Malformed response from health endpoint',
        };
      }
      return {
        success: true,
        data,
        latencyMs,
      };
    } catch {
      return {
        success: false,
        data: null,
        latencyMs,
        error: 'Malformed JSON returned by /api/health',
      };
    }
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    let message = 'Network connection failed or backend unreachable';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Health check connection timed out (4s)';
    } else if (err instanceof Error && err.message) {
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
      const errorMessage = await extractApiErrorMessage(response);
      return {
        success: false,
        data: [],
        error: errorMessage,
      };
    }

    try {
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data as Scheme[],
        };
      }
      return {
        success: false,
        data: [],
        error: 'Unexpected payload format: backend did not return a scheme array',
      };
    } catch {
      return {
        success: false,
        data: [],
        error: 'Malformed JSON received from /api/schemes',
      };
    }
  } catch (err: unknown) {
    let message = 'Failed to fetch schemes from backend';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Request to /api/schemes timed out (5s)';
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }
    return {
      success: false,
      data: [],
      error: message,
    };
  }
}
