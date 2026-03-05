import { useEffect, useRef, useState } from 'react'
import {
  PLATFORM_RULE_MATRIX,
  validateCoT,
  type Platform,
  type ValidationResult,
} from './utils/cotValidator.ts'
import { getStarterTemplate } from './utils/cotTemplates.ts'
import { Activity, ShieldAlert, ShieldCheck } from 'lucide-react'

function App() {
  const [xml, setXml] = useState('')
  const [platform, setPlatform] = useState<Platform>('ATAK')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [activeDiagnosticKey, setActiveDiagnosticKey] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (xml.trim()) {
      setResult(validateCoT(xml, platform))
    } else {
      setResult(null)
    }
  }, [xml, platform])

  const ruleMatrixEntries = Object.entries(PLATFORM_RULE_MATRIX) as Array<
    [Platform, (typeof PLATFORM_RULE_MATRIX)[Platform]]
  >
  const hasHardFails = result ? result.errors.length > 0 : false
  const hasCompatibilityWarnings = result ? result.warnings.length > 0 : false

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

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-mono text-slate-100">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Activity className="text-emerald-400" /> Cursor-on-Target (CoT) Linter
        </h1>
      </header>

      <section className="mb-8 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-xs uppercase tracking-widest text-slate-400">Platform Rule Matrix</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setXml(getStarterTemplate(platform))}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-200"
            >
              Load {platform} Starter Template
            </button>
            <p className="text-xs text-slate-400">
              Select a platform: <span className="font-bold text-emerald-400">{platform}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ruleMatrixEntries.map(([name, rules]) => (
            <button
              type="button"
              key={name}
              onClick={() => setPlatform(name)}
              className={`rounded border p-3 ${
                name === platform
                  ? 'border-emerald-500/60 bg-emerald-900/15'
                  : 'border-slate-600 bg-slate-900/50 hover:border-slate-400'
              }`}
            >
              <h3 className="mb-2 text-left text-sm font-bold text-slate-100">{name}</h3>
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-300">
                {rules.map((rule) => (
                  <li key={`${name}-${rule.tag}`} className="text-left">
                    <code className="font-bold text-slate-200">&lt;{rule.tag}&gt;</code> {rule.description}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>

      <main className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xs uppercase text-slate-500">Input CoT XML</h2>
          <p className="mb-2 text-[11px] text-slate-400">
            Legend: <span className="text-red-300">Blocking</span> stops deploy;{' '}
            <span className="text-amber-300">Warning</span> is advisory.
          </p>
          <textarea
            ref={textareaRef}
            className="h-[500px] w-full rounded border border-slate-700 bg-slate-950 p-4 font-mono text-sm transition-colors focus:border-emerald-500 focus:outline-none"
            placeholder="Paste <event>...</event> here..."
            value={xml}
            onChange={(e) => setXml(e.target.value)}
          />
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-xs uppercase text-slate-500">Validation Status</h2>

          {!result && <div className="italic text-slate-500">Waiting for input...</div>}

          {result && (
            <div className="space-y-6">
              <div
                className={`flex items-center gap-3 rounded p-4 ${
                  hasHardFails
                    ? 'border border-red-500/50 bg-red-900/20'
                    : hasCompatibilityWarnings
                      ? 'border border-amber-500/50 bg-amber-900/20'
                      : 'border border-emerald-500/50 bg-emerald-900/20'
                }`}
              >
                {!hasHardFails ? (
                  <ShieldCheck className="text-emerald-400" />
                ) : (
                  <ShieldAlert className="text-red-400" />
                )}
                <span className="font-bold">
                  {hasHardFails
                    ? 'BLOCKING: Hard-Fail Validation Errors'
                    : hasCompatibilityWarnings
                      ? 'PASSING: Compatibility Warnings Found'
                      : 'PASSING: No Issues Detected'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div
                  className={`rounded border p-3 ${
                    hasHardFails
                      ? 'border-red-500/60 bg-red-900/20 text-red-100'
                      : 'border-slate-700 bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide">Hard Fails (Blocking)</p>
                  <p className="text-xl font-bold">{result.errors.length}</p>
                </div>
                <div
                  className={`rounded border p-3 ${
                    hasCompatibilityWarnings
                      ? 'border-amber-500/60 bg-amber-900/20 text-amber-100'
                      : 'border-slate-700 bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide">Compatibility Warnings (Non-Blocking)</p>
                  <p className="text-xl font-bold">{result.warnings.length}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase text-red-400">
                    Hard Fails (Blocking)
                  </h3>
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
                  <h3 className="mb-2 text-xs font-bold uppercase text-amber-400">
                    Compatibility Warnings (Non-Blocking) ({platform})
                  </h3>
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
                            {warn.text}{' '}
                            <span className="text-amber-300">
                              (line {warn.location.line}, col {warn.location.column})
                            </span>
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
        </section>
      </main>
    </div>
  )
}

export default App
