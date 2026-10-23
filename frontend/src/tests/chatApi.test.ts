import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessage, fetchChatProviders } from '../services/api';
import { ChatRequestPayload } from '../types';

describe('Chat API Client Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully posts chat message and returns genuine AI response payload', async () => {
    const mockSuccessResponse = {
      reply: 'PM-KISAN provides ₹6,000 annually in 3 equal installments to small and marginal farmers.',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      status: 'success',
      latency_ms: 280.5,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    } as Response);

    const payload: ChatRequestPayload = {
      messages: [
        { role: 'user', content: 'What is the financial benefit under PM-KISAN?' },
      ],
      language: 'en',
    };

    const result = await sendChatMessage(payload);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.reply).toContain('PM-KISAN provides ₹6,000');
    expect(result.data?.provider).toBe('gemini');
    expect(result.data?.model).toBe('gemini-2.5-flash');
  });

  it('classifies 429 quota exhaustion response properly', async () => {
    const mockErrorEnvelope = {
      detail: {
        error_type: 'quota_exhausted',
        message: 'Gemini project quota or rate limit has been reached.',
        provider_id: 'gemini',
        retryable: false,
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => mockErrorEnvelope,
    } as Response);

    const result = await sendChatMessage({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('quota_exhausted');
    expect(result.retryable).toBe(false);
    expect(result.error).toContain('quota or rate limit has been reached');
  });

  it('classifies 503 configuration error response properly', async () => {
    const mockErrorEnvelope = {
      detail: {
        error_type: 'configuration_error',
        message: 'GEMINI_API_KEY is not configured on the backend server.',
        provider_id: 'gemini',
        retryable: false,
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => mockErrorEnvelope,
    } as Response);

    const result = await sendChatMessage({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('configuration_error');
    expect(result.retryable).toBe(false);
    expect(result.error).toContain('GEMINI_API_KEY');
  });

  it('handles request timeout gracefully', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError);

    const result = await sendChatMessage({
      messages: [{ role: 'user', content: 'Complex query' }],
    });

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('timeout');
    expect(result.retryable).toBe(true);
    expect(result.error).toContain('timed out');
  });

  it('fetches registered AI provider status list', async () => {
    const mockProviders = [
      {
        provider_id: 'gemini',
        display_name: 'Google Gemini',
        configured: true,
        status: 'ready',
        message: 'Gemini provider ready with gemini-2.5-flash',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockProviders,
    } as Response);

    const result = await fetchChatProviders();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].provider_id).toBe('gemini');
    expect(result.data[0].status).toBe('ready');
  });
});
