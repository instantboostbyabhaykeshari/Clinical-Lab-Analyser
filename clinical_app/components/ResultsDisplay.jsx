import SeverityBadge from "./SeverityBadge";

const sectionTone = {
  critical: "border-red-400/20",
  warning: "border-amber-300/20",
  normal: "border-emerald-300/20",
};

function ResultSection({ title, tone, results }) {
  if (!results.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</h2>
      <div className="grid gap-3">
        {results.map((result) => (
          <article
            key={result.result_id || `${result.test_name}-${result.value}-${result.severity}`}
            className={`rounded-lg border ${sectionTone[tone]} bg-slate-950/80 p-4 shadow-xl shadow-black/20`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-slate-50">{result.test_name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Result: <strong className="text-slate-100">{result.value} {result.unit}</strong>
                  <span className="mx-2 text-slate-700">|</span>
                  Reference: {result.reference_range}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  AI classification: {result.ai_classification || result.severity}
                  {result.rule_based_severity ? ` | Rule-based check: ${result.rule_based_severity}` : ""}
                </p>
              </div>
              <SeverityBadge severity={result.severity} />
            </div>

            <p className="mt-4 rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm leading-6 text-slate-300">
              {result.reason}
            </p>

            <div className="mt-3 min-h-20 rounded-md border border-cyan-400/10 bg-cyan-400/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">AI explanation</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {result.explanation ? (
                  <>
                    {result.explanation}
                    <span className="typing-cursor" aria-hidden="true" />
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <span className="loader-dot" />
                    Generating explanation...
                  </span>
                )}
              </p>
            </div>

            <p className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-3 text-sm font-medium text-slate-200">
              Suggested next step: {result.suggested_next_step}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ResultsDisplay({ results }) {
  if (!results) {
    return null;
  }

  const totalResults = results.critical.length + results.warning.length + results.normal.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-200">Analyzed {totalResults} result(s)</p>
        <p className="text-xs text-slate-500">Critical first, then warning, then normal</p>
      </div>
      <ResultSection title="Critical results" tone="critical" results={results.critical} />
      <ResultSection title="Warning results" tone="warning" results={results.warning} />
      <ResultSection title="Normal results" tone="normal" results={results.normal} />
    </div>
  );
}
