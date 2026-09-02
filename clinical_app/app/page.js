"use client";

import { useState } from "react";

import LabInput from "../components/LabInput";
import ResultsDisplay from "../components/ResultsDisplay";
import { analyzeLabs } from "../services/api";

export default function Home() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAnalyze(labs) {
    setError("");
    setResults(null);
    setLoading(true);

    try {
      setResults(await analyzeLabs(labs));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            GenAI Full-Stack Assignment
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Clinical Lab Results Analyzer</h1>
          <p className="max-w-3xl text-base leading-7 text-slate-700">
            Enter lab results or upload CSV data. The backend classifies values with reference-range logic,
            routes by severity, and uses Gemini through LangChain and LangGraph for cautious explanations.
          </p>
        </header>

        <LabInput loading={loading} onAnalyze={handleAnalyze} onError={setError} />

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        <ResultsDisplay results={results} />
      </div>
    </main>
  );
}
