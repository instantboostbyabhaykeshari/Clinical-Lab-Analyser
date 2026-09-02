import SeverityBadge from "./SeverityBadge";

function ResultSection({ title, results }) {
  if (!results.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="grid gap-3">
        {results.map((result) => (
          <article
            key={result.result_id || `${result.test_name}-${result.value}-${result.severity}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{result.test_name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Result: <strong>{result.value} {result.unit}</strong> | Reference: {result.reference_range}
                </p>
              </div>
              <SeverityBadge severity={result.severity} />
            </div>
            <p className="mt-3 text-sm text-slate-700">{result.reason}</p>
            <p className="mt-2 min-h-6 text-sm leading-6 text-slate-700">
              {result.explanation || "Generating explanation..."}
            </p>
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-800">
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
      <p className="text-sm font-semibold text-slate-700">Analyzed {totalResults} result(s)</p>
      <ResultSection title="Critical results" results={results.critical} />
      <ResultSection title="Warning results" results={results.warning} />
      <ResultSection title="Normal results" results={results.normal} />
    </div>
  );
}
