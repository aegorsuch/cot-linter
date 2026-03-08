
    import { useState } from 'react';
    import { PLATFORM_RULE_MATRIX, type MessageValidationProfile } from './utils/cotValidator.ts';
    import { getAllTemplateLabels, MESSAGE_PROFILES } from './utils/messageProfiles.ts';

    const platforms = Object.keys(PLATFORM_RULE_MATRIX);
    const availableMessageTypes = getAllTemplateLabels();
    const GITHUB_ISSUE_URL = 'https://github.com/aegorsuch/cot-linter/issues/new';

    export default function App() {
      // State for validation
      const [messageType, setMessageType] = useState(availableMessageTypes[0] || '');
      const [xml, setXml] = useState('');
      const [validationResults, setValidationResults] = useState<Array<{ platform: string; profile: MessageValidationProfile; missingTags: string[]; presentTags: string[] }>>([]);

      // State for viewing ideal template
      const [viewPlatform, setViewPlatform] = useState(platforms[0] || '');
      const [viewTemplate, setViewTemplate] = useState(availableMessageTypes[0] || '');

      // State for submit template modal
      const [showSubmitTemplateModal, setShowSubmitTemplateModal] = useState(false);
      const [submissionPlatform, setSubmissionPlatform] = useState(platforms[0] || '');
      const [submissionTemplate, setSubmissionTemplate] = useState(availableMessageTypes[0] || '');
      const [submissionContact, setSubmissionContact] = useState('');
      const [submissionNotes, setSubmissionNotes] = useState('');
      const [submissionXml, setSubmissionXml] = useState('');

      // Handler to open modal
      const openSubmitTemplateModal = () => setShowSubmitTemplateModal(true);

      // Handler to submit template to GitHub
      const handleSubmitTemplate = () => {
        const issueBody = buildSubmissionTemplatePayload(
          submissionPlatform,
          submissionTemplate,
          submissionContact,
          submissionNotes,
          submissionXml
        );
        const url = `${GITHUB_ISSUE_URL}?body=${encodeURIComponent(issueBody)}`;
        window.open(url, '_blank');
        setShowSubmitTemplateModal(false);
      };

      // Build GitHub issue body
      function buildSubmissionTemplatePayload(
        submissionPlatform: string,
        submissionTemplate: string,
        submissionContact: string,
        submissionNotes: string,
        submissionXml: string
      ) {
        return [
          '# CoT Template Submission',
          '',
          `- Platform: ${submissionPlatform}`,
          `- Template: ${submissionTemplate}`,
          `- Submitted at: ${new Date().toISOString()}`,
          `- Contact: ${submissionContact || 'Not provided'}`,
          '',
          '## Notes',
          submissionNotes || 'None',
          '',
          '## XML',
          '```xml',
          submissionXml,
          '```',
        ].join('\n');
      }

      // Find the ideal template XML for selected platform/template
      const idealProfile = (() => {
        const platformKey = viewPlatform as keyof typeof MESSAGE_PROFILES;
        const profiles = Array.isArray(MESSAGE_PROFILES[platformKey]) ? MESSAGE_PROFILES[platformKey] : [];
        return profiles.find((p: MessageValidationProfile) => p.label === viewTemplate);
      })();

      // Handler for validation
      const validateXmlAgainstProfiles = (): Array<{ platform: string; profile: MessageValidationProfile; missingTags: string[]; presentTags: string[] }> => {
        // Basic validation logic: parse XML, compare tags to each profile for selected messageType
        if (!xml.trim()) return [];

        // Parse XML tags
        let parsedTags: string[] = [];
        try {
          const tagRegex = /<([a-zA-Z0-9_:-]+)[\s>]/g;
          parsedTags = Array.from(xml.matchAll(tagRegex)).map(match => match[1]);
        } catch {
          parsedTags = [];
        }

        // For each platform, find the profile for the selected messageType
        return platforms.map(platform => {
          const platformKey = platform as keyof typeof MESSAGE_PROFILES;
          const profiles = Array.isArray(MESSAGE_PROFILES[platformKey]) ? MESSAGE_PROFILES[platformKey] : [];
          const profile = profiles.find((p: MessageValidationProfile) => p.label === messageType);
          if (!profile || !profile.requiredTags) {
            return {
              platform,
              profile: profile || { label: messageType, requiredTags: [], sampleXml: '' },
              missingTags: [],
              presentTags: [],
            };
          }
          // Compare requiredTags to parsedTags
          const presentTags = profile.requiredTags.filter((tag: string) => parsedTags.includes(tag));
          const missingTags = profile.requiredTags.filter((tag: string) => !parsedTags.includes(tag));
          return {
            platform,
            profile,
            missingTags,
            presentTags,
          };
        });
      };

      const handleValidate = () => {
        const results = validateXmlAgainstProfiles();
        setValidationResults(results);
      };

      return (
        <div className="min-h-screen bg-slate-900 p-8 font-mono text-slate-100">
          <header className="mb-8 border-b border-slate-700 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CoT Linter</h1>
              <p className="mt-2 text-sm text-slate-400">Validate CoT XML against all relevant profiles for the selected message type across platforms.</p>
            </div>
            <button
              className="rounded border border-emerald-700 px-4 py-2 text-xs text-emerald-200 bg-slate-800 hover:border-emerald-500"
              onClick={openSubmitTemplateModal}
            >
              Submit Template
            </button>
          </header>
          <main className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Submit Template Modal */}
            {showSubmitTemplateModal && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
                <div className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100" style={{ maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">Submit Template</h3>
                    <button
                      type="button"
                      onClick={() => setShowSubmitTemplateModal(false)}
                      className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-400"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs text-slate-300">
                      Platform
                      <select
                        value={submissionPlatform}
                        onChange={e => setSubmissionPlatform(e.target.value)}
                        className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                      >
                        {platforms.map(platformName => (
                          <option key={`submit-platform-${platformName}`} value={platformName}>{platformName}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-300">
                      Template
                      <select
                        value={submissionTemplate}
                        onChange={e => setSubmissionTemplate(e.target.value)}
                        className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                      >
                        {availableMessageTypes.map(templateName => (
                          <option key={`submission-template-option-${templateName}`} value={templateName}>{templateName}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  </div>
                  <label className="mt-3 block text-xs text-slate-300">
                    Contact (optional)
                    <input
                      type="text"
                      value={submissionContact}
                      onChange={e => setSubmissionContact(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                      placeholder="Email, handle, or team"
                    />
                  </label>
                  <label className="mt-3 block text-xs text-slate-300">
                    Notes (optional)
                    <textarea
                      value={submissionNotes}
                      onChange={e => setSubmissionNotes(e.target.value)}
                      className="mt-1 h-10 w-full resize-none rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-200"
                      placeholder="Notes about this template."
                    />
                  </label>
                  <label className="mt-3 block text-xs text-slate-300">
                    CoT XML
                    <textarea
                      value={submissionXml}
                      onChange={e => setSubmissionXml(e.target.value)}
                      className="mt-1 h-16 w-full rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-200"
                      placeholder="Paste CoT here"
                    />
                  </label>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitTemplate}
                      className="rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-200 hover:border-emerald-500/80"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
            <section className="flex flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <label htmlFor="message-type-select" className="text-xs text-slate-400">Event Type</label>
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
                Validate CoT
              </button>
            </section>
            <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h2 className="mb-4 text-xs uppercase text-slate-500" role="heading" aria-level={2} aria-label="Platform Compatibility Matrix">Platform Compatibility Matrix</h2>
              
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(validationResults.length > 0 ? validationResults : platforms.map(platform => {
                  // Default empty profile for platforms if no validation yet
                  const platformKey = platform as keyof typeof MESSAGE_PROFILES;
                  const profiles = Array.isArray(MESSAGE_PROFILES[platformKey]) ? MESSAGE_PROFILES[platformKey] : [];
                  const profile = profiles.find((p: MessageValidationProfile) => p.label === messageType) || { label: messageType, requiredTags: [], sampleXml: '' };
                  return {
                    platform,
                    profile,
                    missingTags: [],
                    presentTags: [],
                  };
                })).map(({ platform, profile, missingTags, presentTags }) => (
                  <article key={`profile-compare-${platform}`} className="rounded border p-3 border-slate-700 bg-slate-900/40">
                                        <p className="mb-2 text-[11px] text-slate-400">Expected tags:</p>
                                        <ul className="space-y-1 text-xs" aria-label="Expected tags">
                                          {profile.requiredTags && profile.requiredTags.length > 0 ? profile.requiredTags.map((tag: string, idx: number) => (
                                            <li key={idx} className="rounded border border-slate-700/40 bg-slate-950/25 text-slate-200 px-2 py-1">
                                              <code className="font-bold">{tag}</code>
                                            </li>
                                          )) : <li className="text-slate-400">None</li>}
                                        </ul>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-sm font-bold text-slate-100 hover:underline focus:outline-none"
                        aria-label={`Load template for ${platform}`}
                        onClick={() => {
                          setViewPlatform(platform);
                          setViewTemplate(profile.label);
                        }}
                      >
                        {platform}
                      </button>
                      <span className="rounded px-2 py-0.5 text-[11px] font-bold bg-emerald-900/40 text-emerald-200">
                        Missing: {missingTags.length}
                      </span>
                    </div>
                    {/* Profile label removed as requested */}
                    <p className="mb-2 text-[11px] text-slate-400">Present:</p>
                    <ul className="space-y-1 text-xs" aria-label="Present tags">
                      {presentTags.length > 0 ? presentTags.map((tag: string, idx: number) => (
                        <li key={idx} className="rounded border border-emerald-700/40 bg-emerald-950/25 text-emerald-200 px-2 py-1">
                          <code className="font-bold">{tag}</code>
                        </li>
                      )) : <li className="text-slate-400">None</li>}
                    </ul>
                    <p className="mb-2 text-[11px] text-slate-400">Missing:</p>
                    <ul className="space-y-1 text-xs" aria-label="Missing tags">
                      {missingTags.length > 0 ? missingTags.map((tag: string, idx: number) => (
                        <li key={idx} className="rounded border border-amber-700/40 bg-amber-950/25 text-amber-200 px-2 py-1">
                          <code className="font-bold">{tag}</code>
                        </li>
                      )) : <li className="text-slate-400">None</li>}
                    </ul>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        aria-label={`Bulk insert missing tags for ${platform}`}
                        className="rounded border border-amber-700/40 bg-amber-950/25 text-amber-200 px-2 py-1 text-xs"
                        onClick={() => navigator.clipboard.writeText(missingTags.join(','))}
                      >
                        Bulk insert missing tags for {platform}
                      </button>
                      <button
                        type="button"
                        aria-label={`Copy missing tags for ${platform}`}
                        className="rounded border border-emerald-700/40 bg-emerald-950/25 text-emerald-200 px-2 py-1 text-xs"
                        onClick={() => navigator.clipboard.writeText(missingTags.join(','))}
                      >
                        Copy missing tags for {platform}
                      </button>
                    </div>
                    {missingTags.length === 0 && (
                      <p className="result-ok">All required tags present for {platform}.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
            {/* New right panel for viewing ideal template XML */}
            {/* Move Load Template section to bottom of Insert CoT terminal */}
            <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 mt-6">
              <h2 className="mb-4 text-xs uppercase text-slate-500">Load Template</h2>
              <div className="mb-3 flex items-center gap-2">
                <label htmlFor="view-platform-select" className="text-xs text-slate-400">Select Platform</label>
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
                <label htmlFor="view-template-select" className="text-xs text-slate-400">Select Template</label>
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

    // Build GitHub issue body


