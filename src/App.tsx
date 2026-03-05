import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getMissingTagsForAllPlatforms,
  PLATFORM_RULE_MATRIX,
  validateCoTWithProfile,
  type CrossPlatformMissingTagsResult,
  type MessageValidationProfile,
  type Platform,
  type ValidationResult,
} from './utils/cotValidator.ts'
import { getStarterTemplate } from './utils/cotTemplates.ts'
import { getMessageProfilesForPlatform } from './utils/messageProfiles.ts'
import { Activity } from 'lucide-react'

const GUIDE_VISIBILITY_STORAGE_KEY = 'cot-linter-show-guide'

function App() {
  const [xml, setXml] = useState('')
  const [platform, setPlatform] = useState<Platform>('ATAK')
  const [selectedProfileId, setSelectedProfileId] = useState('platform-default')
  const [activeDiagnosticKey, setActiveDiagnosticKey] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(() => {
    const saved = localStorage.getItem(GUIDE_VISIBILITY_STORAGE_KEY)
    if (saved === null) return true
    return saved === 'true'
  })

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const platforms = Object.keys(PLATFORM_RULE_MATRIX) as Platform[]
  const messageProfiles = getMessageProfilesForPlatform(platform)
  const selectedProfile: MessageValidationProfile | null =
    selectedProfileId === 'platform-default'
      ? null
      : messageProfiles.find((profile) => profile.id === selectedProfileId) ?? null

  const selectedTemplateLabel = selectedProfile
    ? `${platform} ${selectedProfile.label} Template`
    : `${platform} SA Template`

  const selectedTemplateXml = useMemo(() => {
    if (selectedProfile) {
      return selectedProfile.sampleXml
    }
    return getStarterTemplate(platform)
  }, [platform, selectedProfile])

  const result: ValidationResult | null = xml.trim()
    ? validateCoTWithProfile(xml, platform, selectedProfile)
    : null

  const hasHardFails = result ? result.errors.length > 0 : false
  const hasCompatibilityWarnings = result ? result.warnings.length > 0 : false

  const crossPlatformMissing: CrossPlatformMissingTagsResult | null = useMemo(() => {
    if (!xml.trim()) return null
    return getMissingTagsForAllPlatforms(xml)
  }, [xml])

  const warningLocationByTag = useMemo(() => {
    const map = new Map<string, { line: number; column: number }>()
    if (!result) return map

    result.warnings.forEach((warning) => {
      const tagMatch = /Missing\s*<([^>]+)>\s*tag/i.exec(warning.text)
      if (tagMatch && tagMatch[1] && !map.has(tagMatch[1])) {
        map.set(tagMatch[1], warning.location)
      }
    })

    return map
  }, [result])

  useEffect(() => {
    localStorage.setItem(GUIDE_VISIBILITY_STORAGE_KEY, String(showGuide))
  }, [showGuide])

  const getLineRange = (text: string, line: number, column: number) => {
    const clampedLine = Math.max(1, line)
    const clampedColumn = Math.max(1, column)
    const lines = text.split('\n')

    const lineIndex = Math.min(clampedLine - 1, Math.max(lines.length - 1, 0))
    let lineStart = 0

    for (let i = 0; i < lineIndex; i += 1) {
      lineStart += lines[i].length + 1
    }

    const lineText = lines[lineIndex] ?? ''
    const cursorOffset = Math.min(clampedColumn - 1, lineText.length)

    return {
      cursorStart: lineStart + cursorOffset,
      lineStart,
      lineEnd: lineStart + lineText.length,
    }
  }

  const jumpToLocation = (line: number, column: number, key: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const range = getLineRange(xml, line, column)
    const selectionEnd = range.lineEnd > range.lineStart ? range.lineEnd : range.cursorStart + 1

    textarea.focus()
    textarea.setSelectionRange(range.lineStart, selectionEnd)
    setActiveDiagnosticKey(key)
  }

  const toLineColFromOffset = (text: string, index: number): { line: number; column: number } => {
    if (index < 0) {
      return { line: 1, column: 1 }
    }

    let line = 1
    let column = 1

    for (let i = 0; i < index && i < text.length; i += 1) {
      if (text[i] === '\n') {
        line += 1
        column = 1
      } else {
        column += 1
      }
    }

    return { line, column }
  }

  const getDetailOrEventLocation = (text: string): { line: number; column: number } => {
    const detailMatch = /<\s*detail(\s|>)/i.exec(text)
    if (detailMatch && detailMatch.index >= 0) {
      return toLineColFromOffset(text, detailMatch.index)
    }

    const eventMatch = /<\s*event(\s|>)/i.exec(text)
    if (eventMatch && eventMatch.index >= 0) {
      return toLineColFromOffset(text, eventMatch.index)
    }

    return { line: 1, column: 1 }
  }

  const jumpToMissingTagContext = (tag: string, key: string) => {
    const location = warningLocationByTag.get(tag) ?? getDetailOrEventLocation(xml)
    jumpToLocation(location.line, location.column, key)
  }

  const copyWithFallback = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const helper = document.createElement('textarea')
      helper.value = text
      helper.setAttribute('readonly', '')
      helper.style.position = 'fixed'
      helper.style.top = '-9999px'
      document.body.appendChild(helper)
      helper.select()
      const didCopy = document.execCommand('copy')
      document.body.removeChild(helper)
      return didCopy
    }
  }

  const getMissingTagsJsonReport = (): string | null => {
    if (!crossPlatformMissing || crossPlatformMissing.parseError) {
      return null
    }

    const platformsWithMissing = crossPlatformMissing.reports.filter(
      (report) => report.missingRules.length > 0,
    )

    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        selectedPlatform: platform,
        selectedProfile: selectedTemplateLabel,
        summary: {
          platformsCompared: crossPlatformMissing.reports.length,
          platformsWithMissingTags: platformsWithMissing.length,
          totalMissingTags: crossPlatformMissing.reports.reduce(
            (total, current) => total + current.missingRules.length,
            0,
          ),
        },
        platforms: crossPlatformMissing.reports.map((report) => ({
          platform: report.platform,
          missingCount: report.missingRules.length,
          missingTags: report.missingRules.map((rule) => ({
            tag: rule.tag,
            description: rule.description,
            suggestionSnippet: rule.suggestionSnippet,
          })),
        })),
      },
      null,
      2,
    )
  }

  const getMissingTagsMarkdownReport = (): string | null => {
    if (!crossPlatformMissing || crossPlatformMissing.parseError) {
      return null
    }

    const reportLines: string[] = [
      '# CoT Missing Tags Report',
      '',
      `- Generated: ${new Date().toISOString()}`,
      `- Selected platform: ${platform}`,
      `- Selected profile: ${selectedTemplateLabel}`,
      `- Platforms compared: ${crossPlatformMissing.reports.length}`,
      '',
      '## Results by Platform',
      '',
    ]

    crossPlatformMissing.reports.forEach((report) => {
      if (report.missingRules.length === 0) {
        reportLines.push(`### ${report.platform}`)
        reportLines.push('No platform-specific tags missing.')
        reportLines.push('')
        return
      }

      reportLines.push(`### ${report.platform}`)
      reportLines.push(`Missing tags: ${report.missingRules.length}`)
      reportLines.push('')

      report.missingRules.forEach((rule) => {
        reportLines.push(`- <${rule.tag}>: ${rule.description}`)
      })

      reportLines.push('')
    })

    return reportLines.join('\n')
  }

  const copyMissingTagsReport = async (format: 'json' | 'markdown') => {
    const report =
      format === 'json' ? getMissingTagsJsonReport() : getMissingTagsMarkdownReport()

    if (!report) {
      setCopyStatus('No cross-platform report available to copy.')
      return
    }

    const didCopy = await copyWithFallback(report)
    setCopyStatus(didCopy ? `Copied ${format.toUpperCase()} report.` : `Unable to copy ${format} report.`)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-mono text-slate-100">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Activity className="text-emerald-400" /> Tactical Assault Kit (TAK) Cursor-on-Target (CoT)
          {' '}Linter
        </h1>
      </header>

      <section className="mb-6 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs uppercase tracking-widest text-slate-400">Inspector Quick Guide</h2>
          <button
            type="button"
            onClick={() => setShowGuide((current) => !current)}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
          >
            {showGuide ? 'Hide Help' : 'Show Help'}
          </button>
        </div>

        {showGuide && (
          <>
            <p className="mb-3 text-sm text-slate-300">
              This inspector validates CoT XML for core schema correctness, platform compatibility,
              and optional message-profile requirements before deploy.
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-300 md:grid-cols-3">
              <p className="rounded border border-slate-700 bg-slate-900/50 p-2">
                1. Choose platform/profile context and review the sample template.
              </p>
              <p className="rounded border border-slate-700 bg-slate-900/50 p-2">
                2. Paste XML on the left or load the sample from the right panel.
              </p>
              <p className="rounded border border-slate-700 bg-slate-900/50 p-2">
                3. Use the validation matrix below for diagnostics, missing tags, and jump-to-line actions.
              </p>
            </div>
          </>
        )}
      </section>

      <section className="mb-6 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400">Validation Context</h2>
            <p className="mt-1 text-xs text-slate-400">
              Select one platform and profile context for warning interpretation and starter samples.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="platform-select" className="text-xs text-slate-400">
              Platform
            </label>
            <select
              id="platform-select"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as Platform)
                setSelectedProfileId('platform-default')
              }}
              className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-200 outline-none transition-colors hover:border-slate-400 focus:border-emerald-500"
            >
              {platforms.map((platformName) => (
                <option key={`platform-option-${platformName}`} value={platformName}>
                  {platformName}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">
              Active: <span className="font-bold text-emerald-400">{platform}</span>
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedProfileId('platform-default')}
            title={`${platform} SA Template`}
            className={`rounded border px-2 py-1 text-xs transition-colors ${
              selectedProfileId === 'platform-default'
                ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-200'
                : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-400'
            } max-w-[15rem] truncate md:max-w-none`}
          >
            {`${platform} SA Template`}
          </button>
          {messageProfiles.map((profile) => (
            <button
              type="button"
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              title={`${platform} ${profile.label} Template`}
              className={`rounded border px-2 py-1 text-xs transition-colors ${
                selectedProfileId === profile.id
                  ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-200'
                  : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-400'
              } max-w-[15rem] truncate md:max-w-none`}
            >
              {`${platform} ${profile.label} Template`}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-400">
          Profiles shown here are for <span className="font-bold text-emerald-400">{platform}</span> only.
        </p>
      </section>

      <main className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xs uppercase text-slate-500">Input CoT XML</h2>
          <textarea
            ref={textareaRef}
            className="h-[500px] w-full rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm transition-colors focus:border-emerald-500 focus:outline-none"
            placeholder="Paste <event>...</event> here..."
            value={xml}
            onChange={(e) => setXml(e.target.value)}
          />
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="mb-2 text-xs uppercase text-slate-500">Sample CoT (Read-Only)</h2>
          <p className="mb-2 text-[11px] text-slate-400">
            Sample loaded from <span className="font-bold text-emerald-300">{selectedTemplateLabel}</span>
          </p>
          <textarea
            readOnly
            value={selectedTemplateXml}
            className="h-[440px] w-full rounded border border-slate-700 bg-slate-950/70 p-4 font-mono text-sm text-slate-300"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setXml(selectedTemplateXml)}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
            >
              Load Sample Into Input
            </button>
            <button
              type="button"
              onClick={() => setXml('')}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-400"
            >
              Clear Input
            </button>
          </div>
        </section>
      </main>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-xs uppercase text-slate-500">Validation Matrix (Cross-Platform Compatibility)</h2>
        <p className="mb-4 text-[11px] text-slate-400">
          Diagnostics and per-platform tag coverage are shown together for faster triage.
        </p>

        {!result && (
          <p className="mb-4 italic text-slate-500">Paste or load XML to generate diagnostics and matrix output.</p>
        )}

        {result && (
          <div className="mb-6 space-y-4 rounded border border-slate-700 bg-slate-900/35 p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div
                className={`rounded border p-3 ${
                  hasHardFails
                    ? 'border-red-500/60 bg-red-900/20 text-red-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300'
                }`}
              >
                <p className="text-xs uppercase tracking-wide">Blocking</p>
                <p className="text-xl font-bold">{result.errors.length}</p>
              </div>
              <div
                className={`rounded border p-3 ${
                  hasCompatibilityWarnings
                    ? 'border-amber-500/60 bg-amber-900/20 text-amber-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300'
                }`}
              >
                <p className="text-xs uppercase tracking-wide">Warning ({platform})</p>
                <p className="text-xl font-bold">{result.warnings.length}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-red-400">Blocking Diagnostics</h3>
                <ul className="space-y-2 text-sm text-red-200">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => jumpToLocation(err.location.line, err.location.column, `error-${i}`)}
                        className={`w-full rounded border p-2 text-left transition-colors ${
                          activeDiagnosticKey === `error-${i}`
                            ? 'border-red-500 bg-red-900/35'
                            : 'border-red-900/40 bg-red-950/20 hover:border-red-700/60'
                        }`}
                      >
                        <p>
                          {err.text}{' '}
                          <span className="text-red-300">(line {err.location.line}, col {err.location.column})</span>
                        </p>
                        <p className="mt-1 text-[11px] text-red-300/90">
                          Code: <code className="rounded bg-red-900/30 px-1 py-0.5">{err.code}</code>
                        </p>
                        {err.suggestion && (
                          <p className="mt-1 text-xs text-red-100">
                            Fix: <code className="rounded bg-red-900/40 px-1 py-0.5">{err.suggestion}</code>
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase text-amber-400">Warning Diagnostics ({platform})</h3>
                <ul className="space-y-2 text-sm text-amber-200">
                  {result.warnings.map((warn, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => jumpToLocation(warn.location.line, warn.location.column, `warn-${i}`)}
                        className={`w-full rounded border p-2 text-left transition-colors ${
                          activeDiagnosticKey === `warn-${i}`
                            ? 'border-amber-500 bg-amber-900/35'
                            : 'border-amber-900/40 bg-amber-950/20 hover:border-amber-700/60'
                        }`}
                      >
                        <p>
                          {warn.text.startsWith(`${platform}:`) ? warn.text : `${platform}: ${warn.text}`}{' '}
                          <span className="text-amber-300">
                            (line {warn.location.line}, col {warn.location.column})
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] text-amber-300/90">
                          Code: <code className="rounded bg-amber-900/30 px-1 py-0.5">{warn.code}</code>
                        </p>
                        {warn.suggestion && (
                          <p className="mt-1 text-xs text-amber-100">
                            Suggested tag:{' '}
                            <code className="rounded bg-amber-900/40 px-1 py-0.5">{warn.suggestion}</code>
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.isValid && result.errors.length === 0 && result.warnings.length === 0 && (
              <p className="text-sm text-emerald-400">Ready for deployment to {platform}.</p>
            )}
          </div>
        )}

        {crossPlatformMissing && !crossPlatformMissing.parseError && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void copyMissingTagsReport('json')
              }}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
            >
              Copy Missing Tags JSON
            </button>
            <button
              type="button"
              onClick={() => {
                void copyMissingTagsReport('markdown')
              }}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
            >
              Copy Missing Tags Markdown
            </button>
            {copyStatus && <span className="text-xs text-slate-400">{copyStatus}</span>}
          </div>
        )}

        {!crossPlatformMissing && <p className="italic text-slate-500">Paste XML to compare platforms.</p>}

        {crossPlatformMissing?.parseError && (
          <div className="rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
            <p>
              Unable to compare platforms: {crossPlatformMissing.parseError.text}{' '}
              <span className="text-red-300">
                (line {crossPlatformMissing.parseError.location.line}, col{' '}
                {crossPlatformMissing.parseError.location.column})
              </span>
            </p>
          </div>
        )}

        {crossPlatformMissing && !crossPlatformMissing.parseError && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {crossPlatformMissing.reports.map((report) => {
              const platformRules = PLATFORM_RULE_MATRIX[report.platform]
              const missingTagSet = new Set(report.missingRules.map((rule) => rule.tag))
              const presentCount = platformRules.length - report.missingRules.length

              return (
                <article
                  key={`compare-${report.platform}`}
                  className={`rounded border p-3 ${
                    report.platform === platform
                      ? 'border-emerald-500/60 bg-emerald-900/15'
                      : 'border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100">{report.platform}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                        report.missingRules.length === 0
                          ? 'bg-emerald-900/40 text-emerald-200'
                          : 'bg-amber-900/40 text-amber-200'
                      }`}
                    >
                      Missing: {report.missingRules.length}
                    </span>
                  </div>

                  <p className="mb-2 text-[11px] text-slate-400">
                    Present: <span className="font-bold text-emerald-300">{presentCount}</span> of{' '}
                    {platformRules.length} expected tags
                  </p>

                  <ul className="space-y-1 text-xs">
                    {platformRules.map((rule) => {
                      const isMissing = missingTagSet.has(rule.tag)
                      const diagnosticKey = `matrix-${report.platform}-${rule.tag}`

                      return (
                        <li
                          key={`${report.platform}-${rule.tag}`}
                          className={`rounded border px-2 py-1 ${
                            isMissing
                              ? 'border-amber-700/40 bg-amber-950/25 text-amber-200'
                              : 'border-emerald-700/30 bg-emerald-950/20 text-emerald-200'
                          }`}
                        >
                          <p className="flex flex-wrap items-center gap-2">
                            <code className="font-bold">&lt;{rule.tag}&gt;</code>
                            <span className="text-[11px] uppercase tracking-wide">
                              {isMissing ? 'missing' : 'present'}
                            </span>
                          </p>
                          <p className="mt-1 text-[11px] text-slate-300">{rule.description}</p>

                          {isMissing && (
                            <>
                              <p className="mt-1 text-[11px] text-amber-100">
                                Add:{' '}
                                <code className="rounded bg-amber-900/30 px-1 py-0.5">
                                  {rule.suggestionSnippet}
                                </code>
                              </p>
                              <button
                                type="button"
                                onClick={() => jumpToMissingTagContext(rule.tag, diagnosticKey)}
                                className={`mt-2 rounded border px-2 py-0.5 text-[11px] transition-colors ${
                                  activeDiagnosticKey === diagnosticKey
                                    ? 'border-amber-500/80 bg-amber-900/35 text-amber-100'
                                    : 'border-amber-700/50 text-amber-200 hover:border-amber-500/80'
                                }`}
                              >
                                Go to insertion point
                              </button>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default App
