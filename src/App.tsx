import { useState } from 'react';
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

export default function App() {
  const [messageType, setMessageType] = useState<string>(PUBLIC_SAMPLES[0].label);
  const [xml, setXml] = useState<string>('');
  const [samplePlatform, setSamplePlatform] = useState(PUBLIC_SAMPLES[0].platform);
  const [targetPlatform, setTargetPlatform] = useState<Platform>('ATAK');
  const [targetResult, setTargetResult] = useState<ValidationResult | null>(null);
  const [sourceResult, setSourceResult] = useState<ValidationResult | null>(null);
  const selectedPublicSample = PUBLIC_SAMPLES.find(sample => sample.platform === samplePlatform && sample.label === messageType);
  const selectedProjectSample = samplePlatform === 'WearTAK' ? PROFILE_TEMPLATES.WearTAK[messageType] : undefined;
  const selectedExampleXml = selectedPublicSample?.xml ?? selectedProjectSample;
  const [showSubmitTemplateModal, setShowSubmitTemplateModal] = useState<boolean>(false);
  const openSubmitTemplateModal = () => setShowSubmitTemplateModal(true);
  const closeSubmitTemplateModal = () => setShowSubmitTemplateModal(false);

  function handleValidate() {
    if (!xml.trim()) {
      setTargetResult(null);
      setSourceResult(null);
      return;
    }
    const sourceProfile = MESSAGE_PROFILES.find(profile => profile.platform === samplePlatform && profile.label === messageType) ?? null;
    const targetProfile = MESSAGE_PROFILES.find(profile => profile.platform === targetPlatform && profile.label === messageType) ?? null;
    setSourceResult(validateCoTWithProfile(xml, samplePlatform, sourceProfile));
    setTargetResult(validateCoTWithProfile(xml, targetPlatform, targetProfile));
  }

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
              onChange={e => { setSamplePlatform(e.target.value as Platform); setTargetResult(null); setSourceResult(null); }}
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
              onChange={e => { setMessageType(e.target.value); setTargetResult(null); setSourceResult(null); }}
            >
              {availableMessageTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <button
              className="rounded border border-emerald-600 bg-emerald-900 px-3 py-2 text-xs text-emerald-100 hover:border-emerald-400"
              disabled={!selectedExampleXml}
              onClick={() => {
                if (!selectedExampleXml) return;
                setXml(selectedExampleXml);
                setTargetResult(null);
                setSourceResult(null);
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
              onChange={e => { setTargetPlatform(e.target.value as Platform); setTargetResult(null); }}
            >
              {platforms.map(platform => <option key={platform} value={platform}>{platform}</option>)}
            </select>
          </div>
          <textarea
            className="w-full h-48 rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm"
            placeholder="Paste <event>...</event> XML here..."
            value={xml}
            onChange={e => { setXml(e.target.value); setTargetResult(null); setSourceResult(null); }}
          />
          <button
            className="mt-2 rounded border border-emerald-500 px-4 py-2 text-xs text-emerald-200 bg-emerald-900 hover:border-emerald-400 shadow"
            onClick={handleValidate}
          >
            Check target compatibility
          </button>
          {targetResult && (
            <section aria-label="Target validation" className="border-t border-slate-700 pt-4 text-sm">
              <h2 className="font-semibold">{targetPlatform} / {messageType}</h2>
              <p className="text-xs text-slate-400">XML checks do not establish that the target client will display or clear this event.</p>
              {messageType.endsWith('Clear') && <p className="mt-2 text-xs text-slate-400">A single clear event cannot establish its relationship to the original point or the target's receive behavior.</p>}
              {sourceResult && sourceResult.errors.some(error => error.code.startsWith('PROFILE_')) && (
                <ul className="mt-2 space-y-1" aria-label="Source profile errors">
                  {sourceResult.errors.filter(error => error.code.startsWith('PROFILE_')).map((error, index) => <li key={index} className="text-rose-300">{samplePlatform} source: {error.text}</li>)}
                </ul>
              )}
              {!MESSAGE_PROFILES.some(profile => profile.platform === targetPlatform && profile.label === messageType) && (
                <p className="mt-2 text-amber-200">No {targetPlatform} {messageType} behavior profile. Target display/clear compatibility is unverified.</p>
              )}
              <ul className="mt-2 space-y-1" aria-label="Validation errors">
                {targetResult.errors.map((error, index) => <li key={index} className="text-rose-300">{error.text} (line {error.location.line}, column {error.location.column})</li>)}
              </ul>
              <ul className="mt-2 space-y-1" aria-label="Validation warnings">
                {targetResult.warnings.filter(warning => messageType === 'SA' || warning.code !== 'PLATFORM_TAG_MISSING').map((warning, index) => <li key={index} className="text-amber-200">{warning.text} (line {warning.location.line}, column {warning.location.column})</li>)}
              </ul>
              {targetResult.errors.length === 0 && !sourceResult?.errors.some(error => error.code.startsWith('PROFILE_')) && <p className="mt-2 text-emerald-300">No structural or known profile errors found. Client behavior is not confirmed.</p>}
            </section>
          )}
          {!MESSAGE_PROFILES.some(profile => profile.platform === targetPlatform && profile.label === messageType) && (
            <button
              className="self-start rounded bg-indigo-700 px-3 py-1 text-xs text-white hover:bg-indigo-800"
              onClick={openSubmitTemplateModal}
            >
              Submit Template
            </button>
          )}
        </section>
      </main>
      {/* Submit Template Modal */}
        {showSubmitTemplateModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100" style={{ maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Submit Template</h2>
                <button className="text-xs text-slate-400 hover:text-emerald-400" onClick={closeSubmitTemplateModal}>Close</button>
              </div>
              <p className="mb-4 text-xs text-slate-400">Paste your ideal CoT XML template for any platform and event type. This will be submitted for review.</p>
              <form className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex flex-col flex-1">
                    <label htmlFor="submit-platform" className="text-xs text-slate-400 mb-1">Platform</label>
                    <select id="submit-platform" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" style={{ minWidth: '120px' }}>
                      {platforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label htmlFor="submit-event-type" className="text-xs text-slate-400 mb-1">Event Type</label>
                    <select id="submit-event-type" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" style={{ minWidth: '120px' }}>
                      {availableMessageTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label htmlFor="submit-email" className="text-xs text-slate-400 mb-1">Email (optional)</label>
                    <input id="submit-email" type="email" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100" placeholder="your@email.com" />
                  </div>
                </div>
                <textarea
                  className="w-full h-48 rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm mb-4"
                  placeholder="Paste ideal <event>...</event> XML here..."
                />
                <button
                  className="rounded border border-emerald-700 px-4 py-2 text-xs text-emerald-200 bg-slate-800 hover:border-emerald-500"
                  onClick={closeSubmitTemplateModal}
                  type="button"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}


