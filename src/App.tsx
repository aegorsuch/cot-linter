import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getMissingTagsForAllPlatforms,
  PLATFORM_RULE_MATRIX,
  type CrossPlatformMissingTagsResult,
  type MessageValidationProfile,
  type Platform,
} from './utils/cotValidator.ts'
import { getStarterTemplate } from './utils/cotTemplates.ts'
import { getAllTemplateLabels, getMessageProfilesForPlatform } from './utils/messageProfiles.ts'

const GITHUB_ISSUE_URL = 'https://github.com/aegorsuch/cot-linter/issues/new'

// ...existing code...

const normalizeLineEndings = (value: string): string => value.replace(/\r\n?/g, '\n')

const normalizeXmlWhitespace = (value: string): string => {
  const normalized = normalizeLineEndings(value)
    .split('\n')
    .map((line) => line.replace(/[\t ]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return normalized.trim()
}

const getXmlDeclaration = (value: string): string | null => {
  const declarationMatch = value.match(/^\s*(<\?xml[^>]*\?>)/i)
  return declarationMatch ? declarationMatch[1] : null
}

const escapeXmlText = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const escapeXmlAttribute = (value: string): string => {
  return escapeXmlText(value).replace(/"/g, '&quot;')
}

const parseXmlDocument = (xmlString: string): { doc: Document | null; error: string | null } => {
  if (!xmlString || typeof xmlString !== 'string' || !xmlString.trim()) {
    return { doc: null, error: 'No XML input provided.' }
  }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      const text = parserError.textContent?.trim()
      // Try to extract line/column info if available
      let location = ''
      const match = text && text.match(/at line (\d+), column (\d+)/i)
      if (match) {
        location = ` (line ${match[1]}, col ${match[2]})`
      }
      return { doc: null, error: (text || 'Unable to parse XML.') + location }
    }
    return { doc, error: null }
  } catch (err) {
    return { doc: null, error: 'XML parsing failed: ' + (err instanceof Error ? err.message : String(err)) }
  }
}

const formatXmlElement = (element: Element, indentLevel: number): string => {
  const indent = '  '.repeat(indentLevel)
  const childIndent = '  '.repeat(indentLevel + 1)
  const attributes = Array.from(element.attributes)
    .map((attr) => ` ${attr.name}="${escapeXmlAttribute(attr.value)}"`)
    .join('')

  const childElements = Array.from(element.children)
  const textContent = Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim()

  if (childElements.length === 0) {
    if (textContent) {
      return `${indent}<${element.tagName}${attributes}>${escapeXmlText(textContent)}</${element.tagName}>`
    }

    return `${indent}<${element.tagName}${attributes}></${element.tagName}>`
  }

  const lines: string[] = [`${indent}<${element.tagName}${attributes}>`]

  if (textContent) {
    lines.push(`${childIndent}${escapeXmlText(textContent)}`)
  }

  for (const child of childElements) {
    lines.push(formatXmlElement(child, indentLevel + 1))
  }

  lines.push(`${indent}</${element.tagName}>`)
  return lines.join('\n')
}

const formatXmlDocument = (doc: Document, declaration: string | null): string => {
  const root = doc.documentElement
  const formattedRoot = formatXmlElement(root, 0)
  return declaration ? `${declaration}\n${formattedRoot}` : formattedRoot
}

// ...existing code...

function App() {
  const [xml, setXml] = useState('')
  const [platform, setPlatform] = useState<Platform>('ATAK')
  const [selectedProfileId, setSelectedProfileId] = useState('platform-default')
  const [activeDiagnosticKey, setActiveDiagnosticKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null)
  const [insertHistory, setInsertHistory] = useState<Array<{ previousXml: string; description: string }>>([])
  const [showSubmitTemplateModal, setShowSubmitTemplateModal] = useState(false)
  const [submissionPlatform, setSubmissionPlatform] = useState<Platform>('ATAK')
  const [submissionProfileLabel, setSubmissionProfileLabel] = useState('SA')
  const [submissionXml, setSubmissionXml] = useState('')
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [submissionContact, setSubmissionContact] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = (text: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, tone })
  }

  const platforms = Object.keys(PLATFORM_RULE_MATRIX) as Platform[]
  const messageProfiles = getMessageProfilesForPlatform(platform)
  const templateLabels = useMemo(() => getAllTemplateLabels(), [])
  const selectedProfile: MessageValidationProfile | null =
    selectedProfileId === 'platform-default'
      ? null
      : messageProfiles.find((profile) => profile.id === selectedProfileId) ?? null

  const templateButtons = useMemo(
    () =>
      templateLabels.map((label) => {
        if (label === 'SA') {
          return {
            id: 'platform-default',
            label,
            isAvailable: true,
            isSelected: selectedProfileId === 'platform-default',
          }
        }

        const profile = messageProfiles.find((candidate) => candidate.label === label)
        return {
          id: profile?.id ?? `missing-${label}`,
          label,
          isAvailable: Boolean(profile),
          isSelected: profile ? selectedProfileId === profile.id : false,
        }
      }),
    [messageProfiles, selectedProfileId, templateLabels],
  )

  const submissionTemplateOptions = templateLabels

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

  // ...existing code...

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const findDetailCloseInsertion = (text: string): { index: number; childIndent: string } | null => {
    const detailCloseRegex = /<\/\s*detail\s*>/i
    const detailCloseMatch = detailCloseRegex.exec(text)
    if (!detailCloseMatch || detailCloseMatch.index < 0) {
      return null
    }

    const insertionIndex = detailCloseMatch.index
    const lineStart = text.lastIndexOf('\n', insertionIndex - 1) + 1
    const closingLine = text.slice(lineStart, insertionIndex)
    const indent = (closingLine.match(/^\s*/) ?? [''])[0]
    const childIndent = `${indent}  `

    return { index: insertionIndex, childIndent }
  }

  const insertTagIntoXml = (
    sourceXml: string,
    tag: string,
    snippet: string,
  ):
    | { ok: true; updatedXml: string; insertedOffset: number }
    | { ok: false; reason: string } => {
    if (!sourceXml || typeof sourceXml !== 'string' || !sourceXml.trim()) {
      return { ok: false, reason: 'No XML content available to insert into.' }
    }
    // Check for malformed XML
    const { doc, error } = parseXmlDocument(sourceXml)
    if (!doc) {
      return { ok: false, reason: `Malformed XML: ${error}` }
    }
    // Check for <detail> element
    const detail = doc.getElementsByTagName('detail')[0]
    if (!detail) {
      return { ok: false, reason: 'No <detail> section found. Add a <detail> element first.' }
    }
    // Check for duplicate tag
    const tagRegex = new RegExp(`<\s*${escapeRegExp(tag)}(\s|>|/)`, 'i')
    if (tagRegex.test(sourceXml)) {
      return { ok: false, reason: `Skipped insert: <${tag}> already exists.` }
    }
    // Find insertion point
    const insertion = findDetailCloseInsertion(sourceXml)
    if (!insertion) {
      return { ok: false, reason: 'Could not find </detail> closing tag. Add a <detail> section first.' }
    }
    // Clean up whitespace before insertion
    const needsLeadingNewline = insertion.index > 0 && sourceXml[insertion.index - 1] !== '\n'
    const insertText = `${needsLeadingNewline ? '\n' : ''}${insertion.childIndent}${snippet}\n`
    const updatedXml = `${sourceXml.slice(0, insertion.index)}${insertText}${sourceXml.slice(insertion.index)}`
    const insertedOffset = insertion.index + (needsLeadingNewline ? 1 : 0) + insertion.childIndent.length
    return { ok: true, updatedXml, insertedOffset }
  }

  const insertSuggestedTag = (tag: string, snippet: string, key: string) => {
    const result = insertTagIntoXml(xml, tag, snippet)
    if (!result.ok) {
      showToast(result.reason, 'error')
      return
    }

    setInsertHistory((current) => [...current, { previousXml: xml, description: `inserted <${tag}>` }])
    const updatedXml = result.updatedXml
    setXml(updatedXml)
    showToast(`Inserted <${tag}>.`, 'success')

    const insertedTagLocation = toLineColFromOffset(updatedXml, result.insertedOffset)
    jumpToLocation(insertedTagLocation.line, insertedTagLocation.column, key)
  }

  const bulkInsertMissingTags = (reportPlatform: Platform, missingRules: Array<{ tag: string; suggestionSnippet: string }>) => {
    if (!xml.trim()) {
      showToast('No XML content available to insert into.', 'error')
      return
    }

    if (missingRules.length === 0) {
      showToast(`No missing tags for ${reportPlatform}.`, 'info')
      return
    }

    let workingXml = xml
    const insertedTags: string[] = []
    let failureReason: string | null = null

    for (const rule of missingRules) {
      const result = insertTagIntoXml(workingXml, rule.tag, rule.suggestionSnippet)
      if (!result.ok) {
        // If malformed XML, abort bulk insert
        if (result.reason && result.reason.startsWith('Malformed XML')) {
          showToast(result.reason, 'error')
          return
        }
        failureReason = result.reason
        continue
      }
      workingXml = result.updatedXml
      insertedTags.push(rule.tag)
    }

    if (insertedTags.length === 0) {
      showToast(failureReason ?? `No tags inserted for ${reportPlatform}.`, 'error')
      return
    }

    setInsertHistory((current) => [
      ...current,
      {
        previousXml: xml,
        description: `bulk insert (${reportPlatform}: ${insertedTags.join(', ')})`,
      },
    ])
    setXml(workingXml)
    showToast(`Inserted ${insertedTags.length} tag(s) for ${reportPlatform}.`, 'success')
  }

  const undoLastInsert = () => {
    if (insertHistory.length === 0) {
      showToast('Nothing to undo.', 'info')
      return
    }

    const previousInsert = insertHistory[insertHistory.length - 1]
    setXml(previousInsert.previousXml)
    showToast(`Undid ${previousInsert.description}.`, 'success')
    setInsertHistory((current) => current.slice(0, -1))
  }

  const undoAllInserts = () => {
    if (insertHistory.length === 0) {
      showToast('Nothing to undo.', 'info')
      return
    }

    setXml(insertHistory[0].previousXml)
    showToast('Undid all insert actions.', 'success')
    setInsertHistory([])
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

  const normalizeWhitespaceInInput = () => {
    if (!xml.trim()) {
      showToast('No XML content available to normalize.', 'info')
      return
    }

    const normalized = normalizeXmlWhitespace(xml)
    setXml(normalized)
    showToast('Normalized XML whitespace.', 'success')
  }

  const formatXmlInInput = () => {
    if (!xml.trim()) {
      showToast('No XML content available to format.', 'info')
      return
    }

    const { doc, error } = parseXmlDocument(xml)
    if (!doc) {
      showToast(`Unable to format XML: ${error}`, 'error')
      return
    }

    const declaration = getXmlDeclaration(xml)
    const formatted = formatXmlDocument(doc, declaration)
    setXml(formatted)
    showToast('Formatted XML.', 'success')
  }

  const sortDetailTagsInInput = () => {
    if (!xml.trim()) {
      showToast('No XML content available to sort.', 'info')
      return
    }

    const { doc, error } = parseXmlDocument(xml)
    if (!doc) {
      showToast(`Unable to sort <detail> tags: ${error}`, 'error')
      return
    }

    const detail = doc.getElementsByTagName('detail')[0]
    if (!detail) {
      showToast('No <detail> element found to sort.', 'error')
      return
    }

    const childElements = Array.from(detail.children)
    if (childElements.length < 2) {
      showToast('Nothing to sort inside <detail>.', 'info')
      return
    }

    const currentOrder = childElements.map((element) => element.tagName)
    const sortedElements = [...childElements].sort((a, b) => a.tagName.localeCompare(b.tagName))
    const sortedOrder = sortedElements.map((element) => element.tagName)

    sortedElements.forEach((element) => {
      detail.appendChild(element)
    })

    const declaration = getXmlDeclaration(xml)
    const formatted = formatXmlDocument(doc, declaration)
    setXml(formatted)

    if (currentOrder.join('|') === sortedOrder.join('|')) {
      showToast('<detail> tags are already sorted.', 'info')
      return
    }

    showToast('Sorted <detail> tags alphabetically.', 'success')
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
      showToast('No cross-platform report available to copy.', 'error')
      return
    }

    const didCopy = await copyWithFallback(report)
    showToast(
      didCopy ? `Copied ${format.toUpperCase()} report.` : `Unable to copy ${format} report.`,
      didCopy ? 'success' : 'error',
    )
  }

  const copyPlatformMissingTagsSnippets = async (
    reportPlatform: Platform,
    missingRules: Array<{ suggestionSnippet: string }>,
  ) => {
    if (missingRules.length === 0) {
      showToast(`No missing tags for ${reportPlatform}.`, 'info')
      return
    }

    const snippets = missingRules.map((rule) => `  ${rule.suggestionSnippet}`).join('\n')
    const payload = `<detail>\n${snippets}\n</detail>`
    const didCopy = await copyWithFallback(payload)

    showToast(
      didCopy
        ? `Copied missing tag snippets for ${reportPlatform}.`
        : `Unable to copy snippets for ${reportPlatform}.`,
      didCopy ? 'success' : 'error',
    )
  }

  const openSubmitTemplateModal = () => {
    setSubmissionPlatform(platform)
    setSubmissionProfileLabel(submissionTemplateOptions[0] ?? 'SA')
    setSubmissionXml('')
    setSubmissionNotes('')
    setSubmissionContact('')
    setShowSubmitTemplateModal(true)
  }

  const buildSubmissionTemplatePayload = (): string => {
    const payload = [
      '# CoT Template Submission',
      '',
      `- Platform: ${submissionPlatform}`,
      `- Profile/Category: ${submissionProfileLabel || 'Unspecified'}`,
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
    ].join('\n')

    return payload
  }

  const openGitHubIssueForSubmission = async () => {
    if (!submissionXml.trim()) {
      showToast('Submission XML is empty.', 'error')
      return
    }

    if (GITHUB_ISSUE_URL.includes('YOUR_ORG')) {
      showToast('Configure GITHUB_ISSUE_URL in App.tsx before using GitHub issue submit.', 'error')
      return
    }

    const payload = buildSubmissionTemplatePayload()
    void copyWithFallback(payload)

    const issueTitle = `[Template Submission] ${submissionPlatform} - ${submissionProfileLabel || 'Unspecified'}`
    const params = new URLSearchParams({
      title: issueTitle,
      body: payload,
    })

    window.open(`${GITHUB_ISSUE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer')
    setShowSubmitTemplateModal(false)
    showToast('Opened GitHub issue with prefilled submission body.', 'success')
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-mono text-slate-100">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          Tactical Assault Kit (TAK) Cursor-on-Target (CoT)
          {' '}Linter
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          This tool is intended to quickly validate CoT XML structure, profile requirements, and platform compatibility.
        </p>
      </header>

      <main className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-h-[480px] flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-4 sm:min-h-[560px] lg:min-h-[680px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs uppercase text-slate-500">Input CoT XML</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={normalizeWhitespaceInInput}
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
              >
                Normalize Whitespace
              </button>
              <button
                type="button"
                onClick={sortDetailTagsInInput}
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
              >
                Sort Detail Tags
              </button>
              <button
                type="button"
                onClick={formatXmlInInput}
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
              >
                Format XML
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="min-h-0 flex-1 w-full resize-none rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm transition-colors focus:border-emerald-500 focus:outline-none"
            placeholder="Paste <event>...</event> here..."
            value={xml}
            onChange={(e) => {
              setXml(e.target.value)
              if (insertHistory.length > 0) {
                setInsertHistory([])
              }
            }}
          />
        </section>

        <section className="flex min-h-[480px] flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-4 sm:min-h-[560px] lg:min-h-[680px]">
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
              <button
                type="button"
                onClick={openSubmitTemplateModal}
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
              >
                Submit Template
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {templateButtons.map((templateProfile) => (
              <button
                type="button"
                key={templateProfile.id}
                onClick={() => {
                  if (!templateProfile.isAvailable) {
                    showToast(
                      `Template "${templateProfile.label}" is missing for ${platform}. Please submit a template.`,
                      'info',
                    )
                    return
                  }

                  setSelectedProfileId(templateProfile.id)
                }}
                title={templateProfile.isAvailable ? templateProfile.label : `${templateProfile.label} (missing)`}
                className={`rounded border px-2 py-1 text-xs transition-colors ${
                  templateProfile.isSelected
                    ? 'border-emerald-500/60 bg-emerald-900/20 text-emerald-200'
                    : templateProfile.isAvailable
                      ? 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-400'
                      : 'border-dashed border-amber-700/60 bg-amber-950/30 text-amber-200 hover:border-amber-500/70'
                } max-w-[15rem] truncate md:max-w-none`}
              >
                {templateProfile.isAvailable ? templateProfile.label : `${templateProfile.label} *`}
              </button>
            ))}
          </div>

          <textarea
            readOnly
            value={selectedTemplateXml}
            className="min-h-0 flex-1 w-full resize-none rounded border border-slate-700 bg-slate-950/70 p-4 font-mono text-sm text-slate-300"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setXml(selectedTemplateXml)
                setInsertHistory([])
                showToast('Copied template into input.', 'success')
              }}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
            >
              Copy into Input
            </button>
          </div>
        </section>
      </main>

      {/* Template Diff Preview section removed */}

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
            <button
              type="button"
              onClick={undoLastInsert}
              disabled={insertHistory.length === 0}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors enabled:hover:border-emerald-500 enabled:hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo Last Insert
            </button>
            <button
              type="button"
              onClick={undoAllInserts}
              disabled={insertHistory.length === 0}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors enabled:hover:border-emerald-500 enabled:hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo All Inserts
            </button>
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
            {crossPlatformMissing.reports
              .slice()
              .sort((a, b) => a.platform.localeCompare(b.platform))
              .map((report) => {
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            report.missingRules.length === 0
                              ? 'bg-emerald-900/40 text-emerald-200'
                              : 'bg-amber-900/40 text-amber-200'
                          }`}
                        >
                          Missing: {report.missingRules.length}
                        </span>
                        {report.missingRules.length > 0 && (
                          <button
                            type="button"
                            onClick={() => bulkInsertMissingTags(report.platform, report.missingRules)}
                            aria-label={`Bulk insert missing tags for ${report.platform}`}
                            className="rounded border border-emerald-700/50 px-2 py-0.5 text-[11px] text-emerald-200 transition-colors hover:border-emerald-500/80"
                          >
                            Bulk Insert
                          </button>
                        )}
                        {report.missingRules.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              void copyPlatformMissingTagsSnippets(report.platform, report.missingRules)
                            }}
                            aria-label={`Copy missing tags for ${report.platform}`}
                            className="rounded border border-slate-600 px-2 py-0.5 text-[11px] text-slate-200 transition-colors hover:border-emerald-500 hover:text-emerald-200"
                          >
                            Copy Missing
                          </button>
                        )}
                      </div>
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

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div
            className={`rounded border px-3 py-2 text-xs shadow-lg ${
              toast.tone === 'success'
                ? 'border-emerald-500/50 bg-emerald-900/85 text-emerald-100'
                : toast.tone === 'error'
                  ? 'border-red-500/50 bg-red-900/85 text-red-100'
                  : 'border-slate-500/50 bg-slate-800/90 text-slate-100'
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {showSubmitTemplateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div
            className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
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
                  onChange={(e) => setSubmissionPlatform(e.target.value as Platform)}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  {platforms.map((platformName) => (
                    <option key={`submit-platform-${platformName}`} value={platformName}>
                      {platformName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-300">
                Template
                <select
                  value={submissionProfileLabel}
                  onChange={(e) => setSubmissionProfileLabel(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  {submissionTemplateOptions.map((templateName) => (
                    <option key={`submission-template-option-${templateName}`} value={templateName}>
                      {templateName}
                    </option>
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
                onChange={(e) => setSubmissionContact(e.target.value)}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                placeholder="Email, handle, or team"
              />
            </label>

            <label className="mt-3 block text-xs text-slate-300">
              Notes (optional)
              <textarea
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="mt-1 h-10 w-full resize-none rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-200"
                placeholder="Notes about this template."
              />
            </label>

            <label className="mt-3 block text-xs text-slate-300">
              CoT XML
              <textarea
                value={submissionXml}
                onChange={(e) => setSubmissionXml(e.target.value)}
                className="mt-1 h-16 w-full rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-200"
              />
            </label>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void openGitHubIssueForSubmission()
                }}
                className="rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-200 hover:border-emerald-500/80"
              >
                Submit GitHub Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
