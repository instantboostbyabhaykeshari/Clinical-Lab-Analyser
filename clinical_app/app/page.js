"use client";

import { useState, useRef, useEffect } from "react";

import LabInput from "../components/LabInput";
import ResultsDisplay from "../components/ResultsDisplay";
import { analyzeLabsStream } from "../services/api";

const emptyResults = {
  critical: [],
  warning: [],
  normal: [],
};

function severityKey(severity) {
  return severity.toLowerCase();
}

function currentOrEmpty(currentResults) {
  return currentResults || { critical: [], warning: [], normal: [] };
}

export default function Home() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");
  const [filter, setFilter] = useState("all");
  const resultsRef = useRef(null);

  // Auto-scroll to results when analysis completes
  useEffect(() => {
    if (!loading && results) {
      const hasData =
        results.critical.length > 0 ||
        results.warning.length > 0 ||
        results.normal.length > 0;
      if (hasData && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [loading, results]);

  async function handleAnalyze(labs) {
    setError("");
    setResults(emptyResults);
    setStreamStatus("Starting analysis...");
    setLoading(true);
    setFilter("all");

    try {
      await analyzeLabsStream(labs, (event) => {
        if (event.event === "stage") {
          setStreamStatus(event.message);
          return;
        }

        if (event.event === "result_start") {
          const key = severityKey(event.result.severity);
          const result = { ...event.result, result_id: event.result_id };
          setResults((currentResults) => {
            const safeResults = currentOrEmpty(currentResults);
            return {
              ...safeResults,
              [key]: [...safeResults[key], result],
            };
          });
          setStreamStatus(`Explaining ${result.test_name}...`);
          return;
        }

        if (event.event === "explanation_delta") {
          const key = severityKey(event.severity);
          setResults((currentResults) => {
            const safeResults = currentOrEmpty(currentResults);
            return {
              ...safeResults,
              [key]: safeResults[key].map((result) =>
                result.result_id === event.result_id
                  ? {
                      ...result,
                      explanation: `${result.explanation || ""}${event.delta}`,
                    }
                  : result,
              ),
            };
          });
          return;
        }

        if (event.event === "result_end") {
          const key = severityKey(event.result.severity);
          setResults((currentResults) => {
            const safeResults = currentOrEmpty(currentResults);
            return {
              ...safeResults,
              [key]: safeResults[key].map((result) =>
                result.result_id === event.result_id
                  ? { ...event.result, result_id: event.result_id }
                  : result,
              ),
            };
          });
          return;
        }

        if (event.event === "complete") {
          setResults(event.results);
          setStreamStatus("Analysis complete");
        }
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  /* ── Derived values for UI ── */
  const filteredResults = results
    ? {
        critical:
          filter === "all" || filter === "critical" ? results.critical : [],
        warning:
          filter === "all" || filter === "warning" ? results.warning : [],
        normal: filter === "all" || filter === "normal" ? results.normal : [],
      }
    : null;

  const totalCount = results
    ? results.critical.length + results.warning.length + results.normal.length
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Sticky Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">LabInsight</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                AI-Powered Clinical Lab Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium sm:inline-flex">
              {loading ? (
                <>
                  <span className="loader-ring" style={{ width: 14, height: 14 }} />
                  <span className="text-blue-600">Analyzing…</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500">AI Analysis Ready</span>
                </>
              )}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          {/* Hero Section */}
          <section className="animate-fade-in">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Clinical Lab Results
            </h2>
            <p className="mt-2 max-w-2xl text-base text-slate-500">
              AI-powered analysis that helps you understand abnormal laboratory
              results with explainable severity classification.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {[
                "AI Analysis Enabled",
                "Explainable Results",
                "Severity Classification",
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600"
                >
                  <svg
                    className="h-4 w-4 text-emerald-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {label}
                </span>
              ))}
            </div>
          </section>

          {/* Lab Input */}
          <LabInput
            loading={loading}
            onAnalyze={handleAnalyze}
            onError={setError}
          />

          {/* Stream Status */}
          {streamStatus && (
            <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {loading ? (
                <span className="loader-ring" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                  <svg
                    className="h-4 w-4 text-emerald-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              <span className="text-sm font-medium text-slate-700">
                {streamStatus}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Analysis Error
                </p>
                <p className="mt-0.5 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* ── Results Dashboard ── */}
          <div ref={resultsRef}>
            {results && totalCount > 0 && (
              <>
                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {results.critical.length}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Critical
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">
                        {results.warning.length}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Warning
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                      <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">
                        {results.normal.length}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Normal
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "critical", label: "Critical" },
                    { key: "warning", label: "Warning" },
                    { key: "normal", label: "Normal" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        filter === key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                      {key !== "all" && results[key] && (
                        <span className="ml-1.5 opacity-70">
                          {results[key].length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <ResultsDisplay results={filteredResults} />
          </div>

          {/* Empty State */}
          {!results && !loading && !error && (
            <div className="animate-fade-in flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <svg
                  className="h-8 w-8 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No laboratory results yet
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                Upload a CSV file or enter lab values manually to begin
                AI-powered analysis.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                  />
                </svg>
              </div>
              <span className="text-base font-bold text-slate-900">
                LabInsight
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Helping users understand laboratory results through explainable AI.
            </p>
            <p className="max-w-lg text-xs text-slate-400">
              AI-generated explanations are for informational purposes and should
              not replace professional medical judgment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>© 2026 LabInsight</span>
              <span>·</span>
              <span>AI-assisted analysis</span>
              <span>·</span>
              <span>Explainable results</span>
              <span>·</span>
              <span>Made by Abhay Keshari IIITBH</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
