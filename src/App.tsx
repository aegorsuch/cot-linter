import { useEffect, useRef, useState } from 'react';
import { validateCoTWithProfile } from './utils/cotValidator';
import type { Platform, ValidationResult } from './utils/cotValidator';
import { getAllTemplateLabels, MESSAGE_PROFILES } from './utils/messageProfiles';
import { PROFILE_TEMPLATES, PUBLIC_SAMPLES } from './utils/cotTemplates';

const basePlatforms = [
  'ATAK',
  'CloudTAK',
  'Lattice',
  'Maven',
  'iTAK',
  'TAK Aware',
  'TAKx',
  'WearTAK',
  'WebTAK',
  'WinTAK',
];
const platforms = basePlatforms;
const availableMessageTypes = Array.from(new Set([...getAllTemplateLabels(), ...PUBLIC_SAMPLES.map(sample => sample.label)])).sort((a, b) => a.localeCompare(b));
type CompatibilityStatus = 'pass' | 'warning' | 'fail' | 'unverified';

interface CompatibilityEntry {
  platform: Platform;
  status: CompatibilityStatus;
  summary: string;
}

interface ValidationReport {
  sourcePlatform: Platform;
  targetPlatform: Platform;
  messageType: string;
  sourceResult: ValidationResult;
  targetResult: ValidationResult;
  compatibilityMatrix: CompatibilityEntry[];
}

const compatibilityStyles: Record<CompatibilityStatus, string> = {
  pass: 'border-emerald-500 bg-emerald-950/40 text-emerald-200',
  warning: 'border-amber-500 bg-amber-950/40 text-amber-200',
  fail: 'border-rose-500 bg-rose-950/40 text-rose-200',
  unverified: 'border-slate-500 bg-slate-900 text-slate-200',
};

export default function App() {
  const [messageType, setMessageType] = useState<string>(PUBLIC_SAMPLES[0].label);
  const [xml, setXml] = useState<string>('');
  const [samplePlatform, setSamplePlatform] = useState(PUBLIC_SAMPLES[0].platform);
  const [targetPlatform, setTargetPlatform] = useState<Platform>('ATAK');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validateTimestamps, setValidateTimestamps] = useState(false);
  const [suggestionSaved, setSuggestionSaved] = useState(false);
  const closeModalButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const selectedPublicSample = PUBLIC_SAMPLES.find(sample => sample.platform === samplePlatform && sample.label === messageType);
  const selectedProjectSample = samplePlatform === 'WearTAK' ? PROFILE_TEMPLATES.WearTAK[messageType] : undefined;
  const selectedExampleXml = selectedPublicSample?.xml ?? selectedProjectSample;
  const [showSubmitTemplateModal, setShowSubmitTemplateModal] = useState<boolean>(false);
  function handleValidate() {
    if (!xml.trim()) {
      setValidationReport(null);
      return;
    }

    const sourceProfile = MESSAGE_PROFILES.find(profile => profile.platform === samplePlatform && profile.label === messageType) ?? null;
    const targetProfile = MESSAGE_PROFILES.find(profile => profile.platform === targetPlatform && profile.label === messageType) ?? null;
    const options = { validateTimestamps };
    const sourceResult = validateCoTWithProfile(xml, samplePlatform, sourceProfile, options);
    const targetResult = validateCoTWithProfile(xml, targetPlatform, targetProfile, options);
    const compatibilityMatrix = platforms.map((platform): CompatibilityEntry => {
      const profile = MESSAGE_PROFILES.find(profile => profile.platform === platform && profile.label === messageType) ?? null;
      const result = validateCoTWithProfile(xml, platform as Platform, profile, { validateTimestamps });
      const hasProfile = Boolean(profile);

      if (result.errors.length > 0) {
        return {
          platform: platform as Platform,
          status: 'fail',
          summary: `${result.errors.length} blocking issue${result.errors.length === 1 ? '' : 's'}`,
        };
      }

      if (!hasProfile) {
        return {
          platform: platform as Platform,
          status: 'unverified',
          summary: 'No behavior profile for this platform and event type',
        };
      }

      if (result.warnings.length > 0) {
        return {
          platform: platform as Platform,
          status: 'warning',
          summary: `${result.warnings.length} heuristic recommendation${result.warnings.length === 1 ? '' : 's'}`,
        };
      }

      return {
        platform: platform as Platform,
        status: 'pass',
        summary: 'No structural or profile issues found',
      };
    });

    setValidationReport({
      sourcePlatform: samplePlatform,
      targetPlatform,
      messageType,
      sourceResult,
      targetResult,
      compatibilityMatrix,
    });
  }

  const openSubmitTemplateModal = () => {
    setSuggestionSaved(false);
    setShowSubmitTemplateModal(true);
  };
  const closeSubmitTemplateModal = () => setShowSubmitTemplateModal(false);

  useEffect(() => {
    if (!showSubmitTemplateModal) return;
    closeModalButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSubmitTemplateModal();
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSubmitTemplateModal]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="w-full py-4 px-8 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/aegorsuch/cot-linter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-300 hover:text-emerald-400 underline"
            aria-label="View source on GitHub"
          >
            View Source on GitHub
          </a>
        </div>
      </header>
      <main className="flex flex-col flex-1 gap-4 p-2 md:p-8">
        <section className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <span className="text-xs text-slate-300">CoT examples</span>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="sample-platform-select" className="text-xs text-slate-400">Source platform:</label>
            <select
              id="sample-platform-select"
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
              value={samplePlatform}
              onChange={e => { setSamplePlatform(e.target.value as Platform); setValidationReport(null); }}
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            <label htmlFor="message-type-select" className="text-xs text-slate-400">Event Type:</label>
            <select
              id="message-type-select"
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
              value={messageType}
              onChange={e => { setMessageType(e.target.value); setValidationReport(null); }}
            >
              {availableMessageTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <button
              className="rounded border border-emerald-600 bg-emerald-900 px-3 py-2 text-xs text-emerald-100 hover:border-emerald-400"
              disabled={!selectedExampleXml}
              onClick={() => {
                if (!selectedExampleXml) return;
                setXml(selectedExampleXml);
                setValidationReport(null);
              }}
            >
              Load example
            </button>
            {selectedPublicSample && <a href={selectedPublicSample.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-300 underline hover:text-emerald-200">View source</a>}
          </div>
          {!selectedExampleXml && <p className="text-xs text-slate-400">No example for this platform and event type.</p>}
          <p className="text-xs text-slate-400">{selectedProjectSample ? 'Project-provided WearTAK example; capture provenance not recorded.' : 'Sanitized adaptations of public fixtures, not verified client captures. Platform labels may be inferred; timestamps are historical.'}</p>
        </section>
        {/* Input and Validation */}
        <section className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2">
            <label htmlFor="target-platform-select" className="text-xs text-slate-400">Target platform:</label>
            <select
              id="target-platform-select"
              className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100"
              value={targetPlatform}
              onChange={e => { setTargetPlatform(e.target.value as Platform); setValidationReport(null); }}
            >
              {platforms.map(platform => <option key={platform} value={platform}>{platform}</option>)}
            </select>
            <label className="ml-2 flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={validateTimestamps}
                onChange={event => { setValidateTimestamps(event.target.checked); setValidationReport(null); }}
                className="h-4 w-4 accent-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
              />
              Validate timestamps
            </label>
          </div>
          <textarea
            className="w-full h-48 rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm"
            placeholder="Paste <event>...</event> XML here..."
            value={xml}
            onChange={e => { setXml(e.target.value); setValidationReport(null); }}
          />
          <button
            className="mt-2 rounded border border-emerald-500 px-4 py-2 text-xs text-emerald-200 bg-emerald-900 hover:border-emerald-400 shadow"
            onClick={handleValidate}
          >
            Check target compatibility
          </button>
          {validationReport && (
            <section aria-label="Compatibility matrix" role="region" className="border-t border-slate-700 pt-4 text-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-100">Compatibility matrix</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {validationReport.compatibilityMatrix.map(({ platform, status, summary }) => (
                  <div key={platform} className={`rounded border p-2 ${compatibilityStyles[status]}`}>
                    <div className="text-[10px] uppercase tracking-wide opacity-80">{platform}</div>
                    <div className="mt-1 text-xs font-semibold capitalize">{status}</div>
                    <div className="mt-1 text-[11px] opacity-90">{summary}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {validationReport && (
            <section aria-label="Target validation" aria-live="polite" className="border-t border-slate-700 pt-4 text-sm">
              <h2 className="font-semibold">{validationReport.targetPlatform} / {validationReport.messageType}</h2>
              <p className="text-xs text-slate-400">XML checks do not establish that the target client will display or clear this event.</p>
              <p className="mt-1 text-xs text-slate-500">Platform tag results are heuristic recommendations based on known rule data.</p>
              {validationReport.messageType.endsWith('Clear') && <p className="mt-2 text-xs text-slate-400">A single clear event cannot establish its relationship to the original point or the target's receive behavior.</p>}
              {validationReport.sourceResult.errors.some(error => error.code.startsWith('PROFILE_')) && (
                <ul className="mt-2 space-y-1" aria-label="Source profile errors">
                  {validationReport.sourceResult.errors.filter(error => error.code.startsWith('PROFILE_')).map((error, index) => <li key={index} className="text-rose-300">{validationReport.sourcePlatform} source: {error.text}</li>)}
                </ul>
              )}
              {!MESSAGE_PROFILES.some(profile => profile.platform === validationReport.targetPlatform && profile.label === validationReport.messageType) && (
                <p className="mt-2 text-amber-200">No {validationReport.targetPlatform} {validationReport.messageType} behavior profile. Target display/clear compatibility is unverified.</p>
              )}
              <ul className="mt-2 space-y-1" aria-label="Validation errors">
                {validationReport.targetResult.errors.map((error, index) => <li key={index} className="text-rose-300">{error.text} (line {error.location.line}, column {error.location.column}){error.suggestion && <span className="block text-xs text-slate-400">Suggestion: {error.suggestion}</span>}</li>)}
              </ul>
              <ul className="mt-2 space-y-1" aria-label="Validation warnings">
                {validationReport.targetResult.warnings.filter(warning => validationReport.messageType === 'SA' || warning.code !== 'PLATFORM_TAG_MISSING').map((warning, index) => <li key={index} className="text-amber-200">{warning.text} (line {warning.location.line}, column {warning.location.column}){warning.suggestion && <span className="block text-xs text-slate-400">Suggestion: {warning.suggestion}</span>}</li>)}
              </ul>
              {validationReport.targetResult.errors.length === 0 && !validationReport.sourceResult.errors.some(error => error.code.startsWith('PROFILE_')) && <p className="mt-2 text-emerald-300">No structural or known profile errors found. Client behavior is not confirmed.</p>}
            </section>
          )}
          {!MESSAGE_PROFILES.some(profile => profile.platform === targetPlatform && profile.label === messageType) && (
            <button
              className="self-start rounded bg-indigo-700 px-3 py-1 text-xs text-white hover:bg-indigo-800"
              onClick={openSubmitTemplateModal}
            >
              Suggest Template
            </button>
          )}
        </section>
      </main>
      {/* Submit Template Modal */}
        {showSubmitTemplateModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4" role="presentation">
            <div ref={modalRef} className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100" style={{ maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }} role="dialog" aria-modal="true" aria-labelledby="suggest-template-title">
              <div className="flex justify-between items-center mb-4">
                <h2 id="suggest-template-title" className="text-lg font-bold">Suggest Template</h2>
                <button ref={closeModalButtonRef} aria-label="Close suggest template dialog" className="rounded px-2 py-1 text-xs text-slate-400 hover:text-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400" onClick={closeSubmitTemplateModal}>Close</button>
              </div>
              <p className="mb-4 text-xs text-slate-400">Save a template suggestion locally for this browser session. No network submission is made.</p>
              <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); localStorage.setItem('cot-linter-template-suggestion', JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()))); setSuggestionSaved(true); }}>
                <div className="flex gap-4">
                  <div className="flex flex-col flex-1">
                    <label htmlFor="submit-platform" className="text-xs text-slate-400 mb-1">Platform</label>
                    <select id="submit-platform" name="platform" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" style={{ minWidth: '120px' }}>
                      {platforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label htmlFor="submit-event-type" className="text-xs text-slate-400 mb-1">Event Type</label>
                    <select id="submit-event-type" name="eventType" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" style={{ minWidth: '120px' }}>
                      {availableMessageTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label htmlFor="submit-email" className="text-xs text-slate-400 mb-1">Email (optional)</label>
                    <input id="submit-email" name="email" type="email" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" placeholder="your@email.com" />
                  </div>
                </div>
                <textarea
                  className="w-full h-48 rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm mb-4"
                  name="xml"
                  placeholder="Paste ideal <event>...</event> XML here..."
                />
                <button className="rounded border border-emerald-700 px-4 py-2 text-xs text-emerald-200 bg-slate-800 hover:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400" type="submit">Save suggestion</button>
                {suggestionSaved && <p role="status" className="text-xs text-emerald-300">Suggestion saved locally for this session.</p>}
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

