import { useEffect, useState } from 'react'
import {
  PLATFORM_RULE_MATRIX,
  validateCoT,
  type Platform,
  type ValidationResult,
} from './utils/cotValidator'
import { Activity, ShieldAlert, ShieldCheck } from 'lucide-react'

function App() {
  const [xml, setXml] = useState('')
  const [platform, setPlatform] = useState<Platform>('ATAK-Civ')
  const [result, setResult] = useState<ValidationResult | null>(null)

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
          <p className="text-xs text-slate-400">
            Select a platform: <span className="font-bold text-emerald-400">{platform}</span>
          </p>
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
          <textarea
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
                  result.isValid
                    ? 'border border-emerald-500/50 bg-emerald-900/20'
                    : 'border border-red-500/50 bg-red-900/20'
                }`}
              >
                {result.isValid ? (
                  <ShieldCheck className="text-emerald-400" />
                ) : (
                  <ShieldAlert className="text-red-400" />
                )}
                <span className="font-bold">
                  {result.isValid ? 'XML VALID' : 'SYNTAX ERRORS DETECTED'}
                </span>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase text-red-400">Critical Errors</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-200">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase text-amber-400">
                    Platform Warnings ({platform})
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-amber-200">
                    {result.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
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
