"use client";

import { useState } from "react";

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

  async function handleAnalyze(labs) {
    setError("");
    setResults(emptyResults);
    setStreamStatus("Starting analysis...");
    setLoading(true);

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
                  ? { ...result, explanation: `${result.explanation || ""}${event.delta}` }
                  : result
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
                  : result
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

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-6 text-[#F5F5F5] sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A3A3A3]">
                GenAI Full-Stack Assignment
              </p>
              <h1 className="text-2xl font-semibold tracking-normal text-[#F5F5F5] sm:text-3xl">
                Clinical Lab Results Analyzer
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[#A3A3A3]">
                Review lab values, route severity, and stream cautious Gemini explanations through the backend agent flow.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2">
                <p className="text-xs text-red-200">Critical</p>
              </div>
              <div className="rounded-md border border-amber-300/20 bg-amber-400/10 px-3 py-2">
                <p className="text-xs text-amber-100">Warning</p>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
                <p className="text-xs text-emerald-100">Normal</p>
              </div>
            </div>
          </div>
        </header>

        <LabInput loading={loading} onAnalyze={handleAnalyze} onError={setError} />

        {streamStatus && (
          <div className="flex items-center gap-3 rounded-md border border-[#2A2A2A] bg-[#171717] p-3 text-sm font-medium text-[#F5F5F5]">
            {loading ? <span className="loader-ring" /> : <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />}
            <span>{streamStatus}</span>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-400/40 bg-red-500/10 p-4 text-sm font-medium text-red-100">
            {error}
          </div>
        )}

        <ResultsDisplay results={results} />

        <footer className="pb-2 text-center text-xs text-[#737373]">
          Copyright © 2026. Made by Abhay Keshari IIITBH.
        </footer>
      </div>
    </main>
  );
}
