import React, { useState } from 'react';
import { Terminal, Check, Copy, Server, Cpu, Play } from 'lucide-react';
import { ApiState } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DeveloperHandshakeProps {
  apiState: ApiState;
}

export const DeveloperHandshake: React.FC<DeveloperHandshakeProps> = ({ apiState }) => {
  const { t, language } = useLanguage();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleTestEndpoint = async (path: string) => {
    setTestingEndpoint(path);
    try {
      const res = await fetch(`${apiState.baseUrl}${path}`);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestResult(`Error: ${err.message}\nMake sure backend is running at ${apiState.baseUrl}`);
      } else {
        setTestResult(`Failed to query ${path}`);
      }
    } finally {
      setTestingEndpoint(null);
    }
  };

  return (
    <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200">
      <div className="mb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
          <Terminal className="w-4 h-4" />
          <span>{t.developer.badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {t.developer.title}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {t.developer.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment & Endpoints Matrix */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Server className="w-4 h-4 text-civic-600" />
              <span>{t.developer.apiContract}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t.developer.activeBase} <code className="text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{apiState.baseUrl}</code>
              {' '}(configurable via <code className="text-slate-800 font-mono text-[11px]">VITE_API_BASE_URL</code>)
            </p>

            <div className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              <div className="p-3 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-emerald-700 mr-2">GET</span>
                  <code className="font-mono text-slate-800 font-semibold">/api/health</code>
                  <span className="text-slate-400 block text-[11px] mt-0.5">
                    {language === 'ta'
                      ? 'இயக்கநேர சுகாதார சோதனை பதில்'
                      : language === 'hi'
                      ? 'रनटाइम स्वास्थ्य जांच प्रतिक्रिया'
                      : 'Runtime health check response'}
                  </span>
                </div>
                <button
                  onClick={() => handleTestEndpoint('/api/health')}
                  disabled={testingEndpoint === '/api/health'}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
                >
                  <Play className="w-3 h-3 text-civic-600" />
                  <span>{testingEndpoint === '/api/health' ? t.developer.testing : t.developer.test}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-emerald-700 mr-2">GET</span>
                  <code className="font-mono text-slate-800 font-semibold">/api/schemes</code>
                  <span className="text-slate-400 block text-[11px] mt-0.5">
                    {language === 'ta'
                      ? 'சரிபார்க்கப்பட்ட திட்ட சேகரிப்பு'
                      : language === 'hi'
                      ? 'सत्यापित योजना संग्रह'
                      : 'Verified scheme collection'}
                  </span>
                </div>
                <button
                  onClick={() => handleTestEndpoint('/api/schemes')}
                  disabled={testingEndpoint === '/api/schemes'}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
                >
                  <Play className="w-3 h-3 text-civic-600" />
                  <span>{testingEndpoint === '/api/schemes' ? t.developer.testing : t.developer.test}</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>
                    {language === 'ta'
                      ? 'நேரடி சோதனை முடிவு:'
                      : language === 'hi'
                      ? 'लाइव परीक्षण परिणाम:'
                      : 'Live Test Result:'}
                  </span>
                  <button
                    onClick={() => setTestResult(null)}
                    className="text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    {language === 'ta' ? 'அழி' : language === 'hi' ? 'साफ़ करें' : 'Clear'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-40">
                  {testResult}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {language === 'ta' ? 'ஆவணங்கள்:' : language === 'hi' ? 'दस्तावेज़ीकरण:' : 'Documentation:'}{' '}
              <code className="text-slate-700">docs/API_CONTRACT.md</code>
            </span>
            <span>FastAPI Docs: <a href={`${apiState.baseUrl}/docs`} target="_blank" rel="noreferrer" className="text-civic-600 hover:underline">/docs</a></span>
          </div>
        </div>

        {/* Quick Run Commands for macOS */}
        <div className="p-6 bg-slate-900 text-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'ta'
                    ? 'உள்ளூர் இயக்கம் (macOS)'
                    : language === 'hi'
                    ? 'स्थानीय निष्पादन (macOS)'
                    : 'Local Execution (macOS)'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {language === 'ta'
                  ? 'தனித்தனி இயக்கங்கள்'
                  : language === 'hi'
                  ? 'स्वतंत्र रनटाइम'
                  : 'Independent runtimes'}
              </span>
            </div>

            {/* Frontend Command */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Frontend Dev Server (Port 5173):</span>
                <button
                  onClick={() => copyToClipboard('cd frontend && npm run dev')}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedText === 'cd frontend && npm run dev' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-300">
                cd frontend && npm run dev
              </pre>
            </div>

            {/* Backend Command */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Backend FastAPI Server (Port 8000):</span>
                <button
                  onClick={() => copyToClipboard('cd backend && source .venv/bin/activate && uvicorn app.main:app --reload')}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedText === 'cd backend && source .venv/bin/activate && uvicorn app.main:app --reload' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-amber-300">
                cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            {language === 'ta'
              ? 'முன்தளம் மற்றும் பின்தளம் ஆகிய இரண்டையும் ஒரே நேரத்தில் இரு டெர்மினல் தாவல்களில் இயக்க முடியும்.'
              : language === 'hi'
              ? 'फ़्रंटएंड और बैकएंड बिना किसी पोर्ट टकराव के दो अलग-अलग टर्मिनल टैब में एक साथ चल सकते हैं।'
              : 'Frontend and Backend can run simultaneously in two terminal tabs without port conflicts.'}
          </div>
        </div>
      </div>
    </section>
  );
};
