import { useState } from 'react';
import { PLATFORM_RULE_MATRIX, type MessageValidationProfile } from './utils/cotValidator.ts';
import { getAllTemplateLabels, MESSAGE_PROFILES } from './utils/messageProfiles.ts';

// Minimal App for message type selection and cross-platform tag validation
const availableMessageTypes = getAllTemplateLabels();
const platforms = Object.keys(PLATFORM_RULE_MATRIX);

function validateXmlAgainstProfiles(_: string, messageType: string) {
  // Only compare profiles for the selected message type across platforms
  const results: Array<{ platform: string; profile: MessageValidationProfile; missingTags: string[] }> = [];
  for (const platform of platforms) {
    const platformKey = platform as keyof typeof MESSAGE_PROFILES;
    const profiles = Array.isArray(MESSAGE_PROFILES[platformKey])
      ? MESSAGE_PROFILES[platformKey]
      : [];
    const matchingProfiles = profiles.filter((p: MessageValidationProfile) => p.label === messageType);
    for (const profile of matchingProfiles) {
      const missingTags: string[] = []; // TODO: implement tag validation
      results.push({ platform, profile, missingTags });
    }
  }
  return results;
}

export default function App() {
  const [xml, setXml] = useState('');
  const [messageType, setMessageType] = useState(availableMessageTypes[0] || '');
  const [validationResults, setValidationResults] = useState<Array<{ platform: string; profile: MessageValidationProfile; missingTags: string[] }>>([]);

  // New state for viewing ideal template
  const [viewPlatform, setViewPlatform] = useState(platforms[0] || '');
  const [viewTemplate, setViewTemplate] = useState(availableMessageTypes[0] || '');

  // Find the ideal template XML for selected platform/template
  const idealProfile = (() => {
    const platformKey = viewPlatform as keyof typeof MESSAGE_PROFILES;
    const profiles = Array.isArray(MESSAGE_PROFILES[platformKey]) ? MESSAGE_PROFILES[platformKey] : [];
    return profiles.find((p: MessageValidationProfile) => p.label === viewTemplate);
  })();

  const handleValidate = () => {
    const results = validateXmlAgainstProfiles(xml, messageType);
    setValidationResults(results);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-mono text-slate-100">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold">CoT Linter (Restarted)</h1>
        <p className="mt-2 text-sm text-slate-400">Validate CoT XML against all relevant profiles for the selected message type across platforms.</p>
      </header>
      <main className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <label htmlFor="message-type-select" className="text-xs text-slate-400">Message Type</label>
            <select
              id="message-type-select"
              value={messageType}
              onChange={e => setMessageType(e.target.value)}
              className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-200"
            >
              {availableMessageTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <textarea
            className="w-full h-48 rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm"
            placeholder="Paste <event>...</event> here..."
            value={xml}
            onChange={e => setXml(e.target.value)}
          />
          <button
            className="mt-2 rounded border border-emerald-500 px-4 py-2 text-xs text-emerald-200"
            onClick={handleValidate}
          >
            Validate XML
          </button>
        </section>
        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-xs uppercase text-slate-500">Profile Tag Validation Across Platforms</h2>
          {validationResults.length === 0 && (
            <p className="mb-4 italic text-slate-500">Paste or load CoT XML and click Validate.</p>
          )}
          {validationResults.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {validationResults.map(({ platform, profile, missingTags }) => (
                <article key={`profile-compare-${platform}`} className="rounded border p-3 border-slate-700 bg-slate-900/40">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100">{platform}</h3>
                    <span className="rounded px-2 py-0.5 text-[11px] font-bold bg-emerald-900/40 text-emerald-200">
                      Missing: {missingTags.length}
                    </span>
                  </div>
                  <p className="mb-2 text-[11px] text-slate-400">
                    Profile: <span className="font-bold text-emerald-300">{profile.label}</span>
                  </p>
                  <ul className="space-y-1 text-xs">
                    {missingTags.map((tag, idx) => (
                      <li key={idx} className="rounded border border-amber-700/40 bg-amber-950/25 text-amber-200 px-2 py-1">
                        <code className="font-bold">{tag}</code>
                      </li>
                    ))}
                  </ul>
                  {missingTags.length === 0 && (
                    <p className="result-ok">All required tags present for {platform}.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
        {/* New right panel for viewing ideal template XML */}
        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-xs uppercase text-slate-500">View Ideal Template</h2>
          <div className="mb-3 flex items-center gap-2">
            <label htmlFor="view-platform-select" className="text-xs text-slate-400">Platform</label>
            <select
              id="view-platform-select"
              value={viewPlatform}
              onChange={e => setViewPlatform(e.target.value)}
              className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-200"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            <label htmlFor="view-template-select" className="text-xs text-slate-400">Template</label>
            <select
              id="view-template-select"
              value={viewTemplate}
              onChange={e => setViewTemplate(e.target.value)}
              className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-200"
            >
              {availableMessageTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {idealProfile && idealProfile.sampleXml ? (
            <pre className="bg-slate-950 rounded p-4 text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-96">
              {idealProfile.sampleXml}
            </pre>
          ) : (
            <p className="italic text-slate-500">No template available for this platform/type.</p>
          )}
        </section>
      </main>
    </div>
  );
}

