import SeverityBadge from "./SeverityBadge";

const sectionConfig = {
  critical: {
    border: "border-l-red-500",
    cardBorder: "border-red-100",
    accent: "bg-red-50",
    icon: (
      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  warning: {
    border: "border-l-amber-500",
    cardBorder: "border-amber-100",
    accent: "bg-amber-50",
    icon: (
      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  normal: {
    border: "border-l-emerald-500",
    cardBorder: "border-emerald-100",
    accent: "bg-emerald-50",
    icon: (
      <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

function ResultSection({ title, tone, results }) {
  if (!results.length) {
    return null;
  }

  const config = sectionConfig[tone];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        {config.icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {results.length}
        </span>
      </div>

      <div className="grid gap-4">
        {results.map((result, index) => (
          <article
            key={result.result_id || `${result.test_name}-${result.value}-${result.severity}`}
            className={`animate-fade-in-up rounded-xl border ${config.cardBorder} border-l-4 ${config.border} bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {/* Header: test name + badge */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {result.test_name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-600">
                    Result:{" "}
                    <strong className="text-slate-900">
                      {result.value} {result.unit}
                    </strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    Reference: {result.reference_range}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  AI classification: {result.ai_classification || result.severity}
                  {result.rule_based_severity
                    ? ` · Rule-based: ${result.rule_based_severity}`
                    : ""}
                </p>
              </div>
              <SeverityBadge severity={result.severity} />
            </div>

            {/* Reason */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-relaxed text-slate-700">{result.reason}</p>
            </div>

            {/* AI Explanation */}
            <div
              className={`mt-3 min-h-20 rounded-lg border ${config.cardBorder} ${config.accent} p-4`}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  AI Clinical Explanation
                </p>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {result.explanation ? (
                  <>
                    {result.explanation}
                    <span className="typing-cursor" aria-hidden="true" />
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <span className="loader-dot" />
                    Generating explanation…
                  </span>
                )}
              </p>
            </div>

            {/* Suggested next step */}
            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-4">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Suggested Next Step
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {result.suggested_next_step}
                </p>
              </div>
            </div>
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

  const totalResults =
    results.critical.length + results.warning.length + results.normal.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-900">
          Analyzed {totalResults} result(s)
        </p>
        <p className="text-xs text-slate-400">
          Critical first, then warning, then normal
        </p>
      </div>
      <ResultSection title="Critical Results" tone="critical" results={results.critical} />
      <ResultSection title="Warning Results" tone="warning" results={results.warning} />
      <ResultSection title="Normal Results" tone="normal" results={results.normal} />
    </div>
  );
}
