import React, { useState } from 'react';
import {
  Files,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building,
  Award,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { DocumentRecord, DocumentPossessionStatus, Scheme, NavigationTab } from '../types';

interface DocumentMapperProps {
  documents: DocumentRecord[];
  schemes: Scheme[];
  selectedSchemeIds: string[];
  onToggleSchemeSelection: (schemeId: string) => void;
  onResetSchemeSelection: () => void;
  onUpdateDocumentStatus: (docId: string, status: DocumentPossessionStatus) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const DocumentMapper: React.FC<DocumentMapperProps> = ({
  documents,
  schemes,
  selectedSchemeIds,
  onToggleSchemeSelection,
  onResetSchemeSelection,
  onUpdateDocumentStatus,
  onNavigate,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'shared' | 'missing' | 'have'>('all');

  // Filter documents that apply to currently selected schemes
  // If no schemes specifically selected, evaluate across all cataloged schemes
  const activeSchemeIds =
    selectedSchemeIds.length > 0 ? selectedSchemeIds : schemes.map((s) => s.id);

  const relevantDocuments = documents.filter((doc) =>
    doc.applicableSchemeIds.some((sId) => activeSchemeIds.includes(sId))
  );

  const haveCount = relevantDocuments.filter((d) => d.status === 'have').length;
  const missingCount = relevantDocuments.filter((d) => d.status === 'missing').length;
  const unconfirmedCount = relevantDocuments.filter((d) => d.status === 'unconfirmed').length;
  const totalCount = relevantDocuments.length;

  const readinessPercent = totalCount > 0 ? Math.round((haveCount / totalCount) * 100) : 0;

  // Documents required by more than one selected scheme = Shared Synergy!
  const sharedDocuments = relevantDocuments.filter(
    (doc) =>
      doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length > 1
  );

  const displayedDocs = relevantDocuments.filter((doc) => {
    if (filterTab === 'shared') {
      return (
        doc.applicableSchemeIds.filter((sId) => activeSchemeIds.includes(sId)).length > 1
      );
    }
    if (filterTab === 'missing') return doc.status === 'missing';
    if (filterTab === 'have') return doc.status === 'have';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Files className="w-4 h-4" />
            <span>Document Synergy Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Document Mapper & Cross-Scheme Synergies
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Compare shared, missing, and unconfirmed certificates across your target government schemes.
          </p>
        </div>

        <button
          onClick={() => onNavigate('readiness-passport')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-semibold text-xs shadow-md transition-all self-start md:self-auto"
        >
          <Award className="w-4 h-4" />
          <span>Generate Readiness Passport</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Schemes Selector Pill Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Schemes for Document Preparation:
            </span>
            <span className="text-xs text-slate-400">
              ({selectedSchemeIds.length === 0 ? 'All schemes active' : `${selectedSchemeIds.length} selected`})
            </span>
          </div>
          {selectedSchemeIds.length > 0 && (
            <button
              type="button"
              onClick={onResetSchemeSelection}
              className="text-xs text-slate-600 hover:text-slate-900 self-start sm:self-auto underline focus:outline-none focus:ring-2 focus:ring-civic-500 rounded px-1"
            >
              Reset to all schemes
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {schemes.map((s) => {
            const isSelected = selectedSchemeIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onToggleSchemeSelection(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-civic-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{s.title.split('(')[0].trim()}</span>
                {isSelected && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Readiness Progress Bar & Synergy Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between md:col-span-1">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Document Readiness Meter
            </span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-slate-900">{readinessPercent}%</span>
              <span className="text-xs text-slate-500">
                ({haveCount} of {totalCount} ready)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-emerald-700 font-bold block">{haveCount}</span>
              <span className="text-slate-500 text-[10px]">Ready</span>
            </div>
            <div>
              <span className="text-rose-700 font-bold block">{missingCount}</span>
              <span className="text-slate-500 text-[10px]">Missing</span>
            </div>
            <div>
              <span className="text-amber-700 font-bold block">{unconfirmedCount}</span>
              <span className="text-slate-500 text-[10px]">Unconfirmed</span>
            </div>
          </div>
        </div>

        {/* Shared Synergy Insight */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-civic-900 to-slate-900 text-white rounded-3xl shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-semibold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cross-Scheme Synergy Unlocked</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {sharedDocuments.length} Shared Documents Found
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Applying for multiple schemes does not mean duplicating paperwork. One verified document
              (such as an Income Certificate or Domicile Certificate) satisfies eligibility proof
              across multiple government ministries.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            {sharedDocuments.map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-medium backdrop-blur-xs"
              >
                <span>{doc.name}</span>
                <span className="text-cyan-300 font-mono text-[10px]">
                  ({doc.applicableSchemeIds.filter((id) => activeSchemeIds.includes(id)).length} schemes)
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Required Documents ({totalCount})
        </button>

        <button
          onClick={() => setFilterTab('shared')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'shared'
              ? 'bg-indigo-700 text-white'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          Shared Synergies ({sharedDocuments.length})
        </button>

        <button
          onClick={() => setFilterTab('missing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'missing'
              ? 'bg-rose-700 text-white'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          Missing Documents ({missingCount})
        </button>

        <button
          onClick={() => setFilterTab('have')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterTab === 'have'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          Ready in Hand ({haveCount})
        </button>
      </div>

      {/* Document Items List */}
      <div className="space-y-4">
        {displayedDocs.length > 0 ? (
          displayedDocs.map((doc) => {
            const applicableInSelection = schemes.filter(
              (s) =>
                doc.applicableSchemeIds.includes(s.id) && activeSchemeIds.includes(s.id)
            );
            const isMultiScheme = applicableInSelection.length > 1;

            return (
              <div
                key={doc.id}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-civic-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                      {isMultiScheme && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Shared ({applicableInSelection.length} schemes)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{doc.description}</p>
                  </div>

                  {/* Interactive Status Selector Pill */}
                  <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => onUpdateDocumentStatus(doc.id, 'have')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        doc.status === 'have'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>I Have This</span>
                    </button>

                    <button
                      onClick={() => onUpdateDocumentStatus(doc.id, 'missing')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        doc.status === 'missing'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missing</span>
                    </button>

                    <button
                      onClick={() => onUpdateDocumentStatus(doc.id, 'unconfirmed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        doc.status === 'unconfirmed'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Unconfirmed</span>
                    </button>
                  </div>
                </div>

                {/* Details Footer: Issuing Authority & Applicable Schemes */}
                <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Building className="w-4 h-4 text-civic-600 shrink-0" />
                    <span>
                      Issuing Authority: <strong className="text-slate-800">{doc.issuingAuthority}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">Required by:</span>
                    {applicableInSelection.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]"
                      >
                        {s.title.split('(')[0].trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No documents in this view</h3>
            <p className="text-xs text-slate-500">
              Change the filter tab above to view all required certificates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
