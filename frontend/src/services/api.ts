/**
 * SevAIQ API Client Service
 * 
 * Configurable base URL with robust error handling for FastAPI error envelopes ({ detail: ... }),
 * network interruptions, malformed JSON, and request timeouts.
 */

import {
  HealthResponse,
  Scheme,
  SchemeDetail,
  CategoryCount,
  BackendCitizenProfile,
  BackendEligibilityCheckResponse,
  DocumentMapperRequest,
  BackendDocumentMappingResponse,
  PassportRequest,
  ChatRequestPayload,
  ChatResponsePayload,
  ProviderStatus,
} from '../types';

export const getApiBaseUrl = (): string => {
  // Configurable via Vite environment variable, fallback to production backend or local FastAPI default
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredUrl && typeof configuredUrl === 'string' && configuredUrl.trim() !== '') {
    return configuredUrl.trim().replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://sevaiq-backend.vercel.app';
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
 * Retrieves distinct scheme categories and counts from GET /api/categories.
 */
export async function fetchCategories(): Promise<{
  success: boolean;
  data: CategoryCount[];
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/categories`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
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
          data: data as CategoryCount[],
        };
      }
      return {
        success: false,
        data: [],
        error: 'Malformed response: expected array from /api/categories',
      };
    } catch {
      return {
        success: false,
        data: [],
        error: 'Malformed JSON received from /api/categories',
      };
    }
  } catch (err: unknown) {
    let message = 'Failed to fetch categories from backend';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Request to /api/categories timed out (5s)';
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

/**
 * Retrieves verified schemes from the backend.
 * Supports optional category and text search ('q') query parameters.
 */
export async function fetchSchemes(params?: {
  category?: string;
  q?: string;
}): Promise<{ success: boolean; data: Scheme[]; error?: string }> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = new URL(`${baseUrl}/api/schemes`);
    if (params?.category && params.category.trim() !== '') {
      url.searchParams.set('category', params.category.trim());
    }
    if (params?.q && params.q.trim() !== '') {
      url.searchParams.set('q', params.q.trim());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
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
      message = 'Request to /api/schemes timed out (6s)';
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

/**
 * Retrieves full verified details, criteria, and requirements for a scheme by ID from GET /api/schemes/{id}.
 */
export async function fetchSchemeById(schemeId: string): Promise<{
  success: boolean;
  data: SchemeDetail | null;
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/schemes/${encodeURIComponent(schemeId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = await extractApiErrorMessage(response);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    }

    try {
      const data = await response.json();
      if (data && typeof data === 'object' && typeof data.id === 'string') {
        return {
          success: true,
          data: data as SchemeDetail,
        };
      }
      return {
        success: false,
        data: null,
        error: 'Malformed response payload from /api/schemes/{id}',
      };
    } catch {
      return {
        success: false,
        data: null,
        error: `Malformed JSON received for scheme ${schemeId}`,
      };
    }
  } catch (err: unknown) {
    let message = `Failed to fetch scheme ${schemeId}`;
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = `Request for scheme ${schemeId} timed out (5s)`;
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }
    return {
      success: false,
      data: null,
      error: message,
    };
  }
}

/**
 * Evaluates a citizen profile against verified schemes via POST /api/eligibility/check.
 */
export async function checkEligibilityApi(profile: BackendCitizenProfile): Promise<{
  success: boolean;
  data: BackendEligibilityCheckResponse | null;
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${baseUrl}/api/eligibility/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(profile),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = await extractApiErrorMessage(response);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    }

    try {
      const data = await response.json();
      if (data && typeof data === 'object' && Array.isArray(data.schemes)) {
        return {
          success: true,
          data: data as BackendEligibilityCheckResponse,
        };
      }
      return {
        success: false,
        data: null,
        error: 'Malformed response structure from /api/eligibility/check',
      };
    } catch {
      return {
        success: false,
        data: null,
        error: 'Malformed JSON received from /api/eligibility/check',
      };
    }
  } catch (err: unknown) {
    let message = 'Eligibility evaluation request failed';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Eligibility evaluation timed out (8s)';
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }
    return {
      success: false,
      data: null,
      error: message,
    };
  }
}

/**
 * Analyzes document requirements and reusability across selected schemes via POST /api/documents/mapper.
 */
export async function mapDocumentsApi(request: DocumentMapperRequest): Promise<{
  success: boolean;
  data: BackendDocumentMappingResponse | null;
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${baseUrl}/api/documents/mapper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = await extractApiErrorMessage(response);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    }

    try {
      const data = await response.json();
      if (data && typeof data === 'object' && Array.isArray(data.selected_scheme_ids)) {
        return {
          success: true,
          data: data as BackendDocumentMappingResponse,
        };
      }
      return {
        success: false,
        data: null,
        error: 'Malformed response payload from /api/documents/mapper',
      };
    } catch {
      return {
        success: false,
        data: null,
        error: 'Malformed JSON received from /api/documents/mapper',
      };
    }
  } catch (err: unknown) {
    let message = 'Document mapping request failed';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Document mapper request timed out (8s)';
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }
    return {
      success: false,
      data: null,
      error: message,
    };
  }
}

/**
 * Requests an in-memory generated Scheme Passport PDF from POST /api/passport/pdf.
 * Returns the application/pdf Blob and extracted filename.
 */
export async function downloadPassportPdfApi(request: PassportRequest): Promise<{
  success: boolean;
  blob: Blob | null;
  filename: string;
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/api/passport/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = await extractApiErrorMessage(response);
      return {
        success: false,
        blob: null,
        filename: '',
        error: errorMessage,
      };
    }

    // Extract filename from Content-Disposition header if available
    let filename = 'SevAIQ_Scheme_Passport.pdf';
    const disposition =
      response.headers.get('Content-Disposition') ||
      response.headers.get('content-disposition');
    if (disposition) {
      const filenameMatch = disposition.match(/filename\*?=['"]?(?:UTF-8'')?([^"';]+)['"]?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].trim());
      }
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      return {
        success: false,
        blob: null,
        filename: '',
        error: 'Backend returned an empty PDF stream',
      };
    }

    return {
      success: true,
      blob,
      filename,
    };
  } catch (err: unknown) {
    let message = 'Passport PDF generation failed';
    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Passport PDF generation timed out (15s)';
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }
    return {
      success: false,
      blob: null,
      filename: '',
      error: message,
    };
  }
}

/**
 * Triggers a browser download of a received PDF Blob, safely revoking the ObjectURL afterwards.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || !window.URL || !document.body) {
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    try {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 200);
}

/**
 * Sends a conversation turn to the backend AI Chatbot (POST /api/chat).
 * Returns the genuine AI response or structured provider error.
 */
export async function sendChatMessage(request: ChatRequestPayload): Promise<{
  success: boolean;
  data: ChatResponsePayload | null;
  error?: string;
  errorType?: string;
  retryable?: boolean;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorType = 'unknown';
      let retryable = false;
      let errorMessage = 'AI Chatbot service error';

      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          if (typeof errJson.detail === 'object') {
            errorType = errJson.detail.error_type || errorType;
            errorMessage = errJson.detail.message || errorMessage;
            retryable = Boolean(errJson.detail.retryable);
          } else if (typeof errJson.detail === 'string') {
            errorMessage = errJson.detail;
          }
        }
      } catch {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }

      return {
        success: false,
        data: null,
        error: errorMessage,
        errorType,
        retryable,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data as ChatResponsePayload,
    };
  } catch (err: unknown) {
    let message = 'Failed to connect to AI Chatbot service';
    let errorType = 'network_error';
    let retryable = true;

    if (err instanceof DOMException && err.name === 'AbortError') {
      message = 'Request to AI Chatbot timed out (20s)';
      errorType = 'timeout';
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }

    return {
      success: false,
      data: null,
      error: message,
      errorType,
      retryable,
    };
  }
}

/**
 * Fetches operational readiness status of registered AI providers (GET /api/chat/providers).
 */
export async function fetchChatProviders(): Promise<{
  success: boolean;
  data: ProviderStatus[];
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/chat/providers`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        data: [],
        error: `HTTP error ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: Array.isArray(data) ? (data as ProviderStatus[]) : [],
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : 'Failed to fetch AI providers',
    };
  }
}
