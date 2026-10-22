import React from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ApiState } from '../types';

interface HeaderProps {
  apiState: ApiState;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiState, onRefreshHealth }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 via-civic-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                Sev<span className="text-civic-600">AI</span>Q
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                Seva First 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Civic Intelligence & Verified Scheme Matching
            </p>
          </div>
        </div>

        {/* Live Backend Connection Indicator */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              apiState.status === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : apiState.status === 'checking'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={`API Target: ${apiState.baseUrl}`}
          >
            {apiState.status === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Backend:</span>
                <span>Healthy</span>
                {apiState.latencyMs !== null && (
                  <span className="text-emerald-600 font-mono text-[10px]">({apiState.latencyMs}ms)</span>
                )}
              </>
            ) : apiState.status === 'checking' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking API...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Backend:</span>
                <span>Offline</span>
              </>
            )}
          </div>

          <button
            onClick={onRefreshHealth}
            disabled={apiState.status === 'checking'}
            aria-label="Refresh API connection status"
            title="Ping backend /api/health"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${apiState.status === 'checking' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
