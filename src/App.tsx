import { useState } from 'react';
import type { MessageValidationProfile } from './utils/cotValidator';
import { getAllTemplateLabels, MESSAGE_PROFILES } from './utils/messageProfiles';
import { PROFILE_TEMPLATES } from './utils/cotTemplates';

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
const availableMessageTypes = getAllTemplateLabels();

export default function App() {
  const [messageType, setMessageType] = useState<string>(availableMessageTypes[0] || '');
  const [xml, setXml] = useState<string>('');
  const [validationResults, setValidationResults] = useState<Array<{ platform: string; missingTags: string[] }>>([]);
  const [showSubmitTemplateModal, setShowSubmitTemplateModal] = useState<boolean>(false);
  const openSubmitTemplateModal = () => setShowSubmitTemplateModal(true);
  const closeSubmitTemplateModal = () => setShowSubmitTemplateModal(false);

  function handleValidate() {
    if (!xml.trim()) {
      setValidationResults([]);
      return;
    }
    // Extract tags only from <detail>
    const detailTags: string[] = [];
    try {
      const detailMatch = xml.match(/<detail[^>]*>([\s\S]*?)<\/detail>/i);
      if (detailMatch) {
        const detailContent = detailMatch[1];
        const tagRegex = /<([a-zA-Z0-9_:-]+)[\s>]/g;
        let match;
        while ((match = tagRegex.exec(detailContent))) {
          detailTags.push(match[1]);
        }
      }
    } catch {
      // ignore parse errors
    }
    const results = platforms.map((platform: string) => {
      const profile = MESSAGE_PROFILES.find((p: MessageValidationProfile) => p.platform === platform && p.label === messageType);
      const missingTags = profile && profile.requiredDetailTags ? profile.requiredDetailTags.filter((tag: string) => !detailTags.includes(tag)) : [];
      return { platform, missingTags };
    });
    setValidationResults(results);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="w-full py-4 px-8 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">CoT Linter</h1>
          <span className="text-xs text-slate-400">Validate CoT XML for all platforms</span>
        </div>
      </header>
      <main className="flex flex-col md:flex-row flex-1 gap-4 md:gap-8 p-2 md:p-8">
        {/* Left Panel: Input and Validation */}
        <section className="flex flex-col gap-4 w-full md:w-1/3">
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="message-type-select" className="text-xs text-slate-400">Event Type:</label>
            <select
              id="message-type-select"
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 w-auto"
              value={messageType}
              onChange={e => setMessageType(e.target.value)}
              style={{ minWidth: '120px', maxWidth: '180px' }}
            >
              {availableMessageTypes.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <textarea
            className="w-full h-48 rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm"
            placeholder="Paste <event>...</event> XML here..."
            value={xml}
            onChange={e => setXml(e.target.value)}
          />
          <button
            className="mt-2 rounded border border-emerald-500 px-4 py-2 text-xs text-emerald-200 bg-emerald-900 hover:border-emerald-400 shadow"
            onClick={handleValidate}
          >
            Validate CoT
          </button>
        </section>
        {/* Right Panel: Compatibility Matrix */}
        <section className="bg-slate-900 rounded-lg shadow-lg p-4 md:p-6 flex flex-col w-full md:w-2/3">
          <h2 className="mb-6 text-xs text-slate-500 font-semibold tracking-wider">Compatibility Matrix</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {(() => {
              const results = validationResults.length > 0 ? validationResults : platforms.map(platform => ({ platform, missingTags: [] }));
              // List of verified platforms
              // List of verified platform/template combinations
              const verifiedMatrix = [
                { platform: "ATAK", label: "Manual Alert" },
                { platform: "ATAK", label: "Manual Alert Clear" },
                { platform: "ATAK", label: "MIL-STD-2525D Drop" },
                { platform: "WearTAK", label: "SA" },
                { platform: "WearTAK", label: "Chat Send" },
                { platform: "WearTAK", label: "MIL-STD-2525D Drop" },
                { platform: "WearTAK", label: "MIL-STD-2525D Clear" },
                { platform: "WearTAK", label: "Manual Alert" },
                { platform: "WearTAK", label: "Manual Alert Clear" },
                { platform: "WearTAK", label: "Manual Alert Gunshot" },
              ];
              // Find the message type for each platform
              return results
                .slice()
                .sort((a, b) => a.platform.localeCompare(b.platform))
                .map(({ platform, missingTags }) => {
                  let label = messageType;
                  if (!label && validationResults.length === 0) {
                    label = "Manual Alert";
                  }
                  const isVerified = verifiedMatrix.some(v => v.platform === platform && v.label === label);
                  const isUnverifiedATAK = platform === "ATAK" && ["Chat Send", "SA", "MIL-STD-2525D Clear"].includes(label);
                  const finalVerified = isVerified && !isUnverifiedATAK;
                  // Check if profile-specific template exists
                  const hasProfileTemplate = PROFILE_TEMPLATES[platform] && PROFILE_TEMPLATES[platform][label];
                  const template = hasProfileTemplate ? PROFILE_TEMPLATES[platform][label] : '';
                  const handleLoadTemplate = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setXml(template);
                  };
                  return (
                    <article
                      key={`profile-compare-${platform}`}
                      className={`rounded-lg border p-4 shadow ${finalVerified ? "border-slate-700 bg-slate-900/40" : "border-slate-800 bg-slate-800/60 opacity-60"}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold ${finalVerified ? "text-slate-100" : "text-slate-400"}`}>{platform}</span>
                        {hasProfileTemplate && (
                          <button
                            className="ml-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1 px-3 rounded shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 text-xs"
                            onClick={handleLoadTemplate}
                            aria-label={`Load for ${platform}`}
                          >
                            Load
                          </button>
                        )}
                      </div>
                      {finalVerified ? (
                        <>
                          <p className="mb-2 text-[11px] text-slate-400">Missing:</p>
                          <ul className="space-y-1 text-xs" aria-label="Missing tags">
                            {missingTags.length > 0 ? missingTags.map((tag: string, idx: number) => (
                              <li key={idx} className="rounded border border-amber-700/40 bg-amber-950/25 text-amber-200 px-2 py-1">
                                <code className="font-bold">{tag}</code>
                              </li>
                            )) : <li className="text-slate-400">None</li>}
                          </ul>
                        </>
                      ) : (
                        <div className="mt-2 flex flex-col items-start">
                          <p className="text-xs text-slate-400 mb-2">No template available.</p>
                          <button
                            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-1 px-3 rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 text-xs"
                            onClick={openSubmitTemplateModal}
                            aria-label="Submit Template"
                          >
                            Submit Template
                          </button>
                        </div>
                      )}
                    </article>
                  );
                });
            })()}
          </div>
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


