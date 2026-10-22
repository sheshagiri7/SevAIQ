/**
 * Type definitions for SevAIQ Frontend
 * Aligned with docs/API_CONTRACT.md
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | string;
  service: string;
  version: string;
}

export interface Scheme {
  id: string;
  title: string;
  short_description: string;
  category: string;
  ministry: string;
  beneficiary_type?: string | null;
  official_portal_url?: string | null;
  verified: boolean;
  verification_source?: string | null;
}

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export interface ApiState {
  status: ConnectionStatus;
  baseUrl: string;
  health: HealthResponse | null;
  latencyMs: number | null;
  errorMessage: string | null;
  lastChecked: Date | null;
}
