import { describe, it, expect } from 'vitest';
import { extractApiErrorMessage } from '../services/api';

describe('FastAPI API Error Message Extractor', () => {
  it('parses standard FastAPI string detail format', async () => {
    const mockResponse = new Response(
      JSON.stringify({ detail: 'Scheme record not found in verified database' }),
      { status: 404, statusText: 'Not Found' }
    );
    const message = await extractApiErrorMessage(mockResponse);
    expect(message).toBe('Scheme record not found in verified database [HTTP 404 (Not Found)]');
  });

  it('parses FastAPI validation error array format (HTTP 422)', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        detail: [
          { loc: ['body', 'age'], msg: 'ensure this value is greater than 0', type: 'value_error' },
          { loc: ['body', 'income'], msg: 'field required', type: 'value_error.missing' },
        ],
      }),
      { status: 422, statusText: 'Unprocessable Entity' }
    );
    const message = await extractApiErrorMessage(mockResponse);
    expect(message).toContain('ensure this value is greater than 0 (age)');
    expect(message).toContain('field required (income)');
    expect(message).toContain('HTTP 422');
  });

  it('falls back gracefully to HTTP status when body is empty or non-JSON', async () => {
    const mockResponse = new Response('', { status: 500, statusText: 'Internal Server Error' });
    const message = await extractApiErrorMessage(mockResponse);
    expect(message).toBe('HTTP 500 (Internal Server Error)');
  });

  it('handles plaintext server errors cleanly', async () => {
    const mockResponse = new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });
    const message = await extractApiErrorMessage(mockResponse);
    expect(message).toBe('Bad Gateway [HTTP 502 (Bad Gateway)]');
  });
});
