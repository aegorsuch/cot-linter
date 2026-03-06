import { useMemo, useRef, useState } from 'react'
import {
  getMissingTagsForAllPlatforms,
  PLATFORM_RULE_MATRIX,
  type CrossPlatformMissingTagsResult,
  type MessageValidationProfile,
  type Platform,
} from './utils/cotValidator.ts'
import { getStarterTemplate } from './utils/cotTemplates.ts'
import { getMessageProfilesForPlatform } from './utils/messageProfiles.ts'
import { Activity } from 'lucide-react'

function App() {
  const [xml, setXml] = useState('')
  const [platform, setPlatform] = useState<Platform>('ATAK')
  const [selectedProfileId, setSelectedProfileId] = useState('platform-default')
  const [activeDiagnosticKey, setActiveDiagnosticKey] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [insertStatus, setInsertStatus] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const platforms = Object.keys(PLATFORM_RULE_MATRIX) as Platform[]
  const messageProfiles = getMessageProfilesForPlatform(platform)
  const selectedProfile: MessageValidationProfile | null =
    selectedProfileId === 'platform-default'
      ? null
      : messageProfiles.find((profile) => profile.id === selectedProfileId) ?? null

  const selectedTemplateLabel = selectedProfile
    ? `${platform} ${selectedProfile.label}`
    : `${platform} SA`

  const selectedTemplateXml = useMemo(() => {
    if (selectedProfile) {
      return selectedProfile.sampleXml
    }
    return getStarterTemplate(platform)
  }, [platform, selectedProfile])

  const crossPlatformMissing: CrossPlatformMissingTagsResult | null = useMemo(() => {
    if (!xml.trim()) return null
    return getMissingTagsForAllPlatforms(xml)
  }, [xml])

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

  const insertionLocation = useMemo(() => getDetailOrEventLocation(xml), [xml])

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const insertSuggestedTag = (tag: string, snippet: string, key: string) => {
    if (!xml.trim()) {
      setInsertStatus('No XML content available to insert into.')
      return
    }

    const tagRegex = new RegExp(`<\\s*${escapeRegExp(tag)}(\\s|>|/)`, 'i')
    if (tagRegex.test(xml)) {
      setInsertStatus(`Skipped insert: <${tag}> already exists.`)
      return
    }

    const detailCloseRegex = /<\/\s*detail\s*>/i
    const detailCloseMatch = detailCloseRegex.exec(xml)
    if (!detailCloseMatch || detailCloseMatch.index < 0) {
      setInsertStatus('Could not find </detail>. Add a <detail> section first.')
      return
    }

    const insertionIndex = detailCloseMatch.index
    const lineStart = xml.lastIndexOf('\n', insertionIndex - 1) + 1
    const closingLine = xml.slice(lineStart, insertionIndex)
    const indent = (closingLine.match(/^\s*/) ?? [''])[0]
    const childIndent = `${indent}  `

    const needsLeadingNewline = insertionIndex > 0 && xml[insertionIndex - 1] !== '\n'
    const insertText = `${needsLeadingNewline ? '\n' : ''}${childIndent}${snippet}\n`

    const updatedXml = `${xml.slice(0, insertionIndex)}${insertText}${xml.slice(insertionIndex)}`
    setXml(updatedXml)
    setInsertStatus(`Inserted <${tag}>.`)

    const insertedTagOffset = insertionIndex + (needsLeadingNewline ? 1 : 0) + childIndent.length
    const insertedTagLocation = toLineColFromOffset(updatedXml, insertedTagOffset)
    jumpToLocation(insertedTagLocation.line, insertedTagLocation.column, key)
  }

  const jumpToMissingTagContext = (tag: string, key: string) => {
    void tag
    const location = insertionLocation
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

      <main className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex h-[340px] flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="mb-3 text-xs uppercase text-slate-500">Input CoT XML</h2>
          <textarea
            ref={textareaRef}
            className="min-h-0 flex-1 w-full resize-none rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm transition-colors focus:border-emerald-500 focus:outline-none"
            placeholder="Paste <event>...</event> here..."
            value={xml}
            onChange={(e) => setXml(e.target.value)}
          />
        </section>

        <section className="flex h-[340px] flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase text-slate-500">Template CoT (Read-Only)</h2>
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedProfileId('platform-default')}
              title="SA"
              className={`rounded border px-2 py-1 text-xs transition-colors ${
                selectedProfileId === 'platform-default'
                  ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-200'
                  : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-400'
              } max-w-[15rem] truncate md:max-w-none`}
            >
              SA
            </button>
            {messageProfiles.map((profile) => (
              <button
                type="button"
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                title={profile.label}
                className={`rounded border px-2 py-1 text-xs transition-colors ${
                  selectedProfileId === profile.id
                    ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-200'
                    : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-400'
                } max-w-[15rem] truncate md:max-w-none`}
              >
                {profile.label}
              </button>
            ))}
          </div>

          <textarea
            readOnly
            value={selectedTemplateXml}
            className="min-h-0 flex-1 w-full resize-none rounded border border-slate-700 bg-slate-950/70 p-4 font-mono text-sm text-slate-300"
          />
        </section>
      </main>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-xs uppercase text-slate-500">Platform Compatibility Matrix</h2>

        {!crossPlatformMissing && (
          <p className="mb-4 italic text-slate-500">Paste or load CoT XML to run validation.</p>
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
            {insertStatus && <span className="text-xs text-slate-400">{insertStatus}</span>}
          </div>
        )}

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
                                {`Go to insertion point (line ${insertionLocation.line}, col ${insertionLocation.column})`}
                              </button>
                              <button
                                type="button"
                                onClick={() => insertSuggestedTag(rule.tag, rule.suggestionSnippet, diagnosticKey)}
                                className="mt-2 ml-2 rounded border border-emerald-700/50 px-2 py-0.5 text-[11px] text-emerald-200 transition-colors hover:border-emerald-500/80"
                              >
                                {`Insert <${rule.tag}>`}
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
