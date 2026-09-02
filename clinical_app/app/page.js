"use client";

import { useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000/analyze_labs";

const sampleCsv = `test_name,value,unit
Hemoglobin,11.2,g/dL
Ferritin,220,ug/L
Protein (Strip),Negatif,mg/dL`;

function SeverityBadge({ severity }) {
  const styles = {
    Critical: "bg-red-100 text-red-800 border-red-300",
    Warning: "bg-amber-100 text-amber-800 border-amber-300",
    Normal: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  const icon = severity === "Normal" ? "✓" : "!";

  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-md border px-3 py-1 text-sm font-semibold ${styles[severity]}`}
    >
      <span className="mr-2">{icon}</span>
      {severity}
    </span>
  );
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV must include a header and at least one lab row.");
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const nameIndex = headers.indexOf("test_name");
  const valueIndex = headers.indexOf("value");
  const unitIndex = headers.indexOf("unit");

  if (nameIndex === -1 || valueIndex === -1 || unitIndex === -1) {
    throw new Error("CSV headers must be: test_name,value,unit");
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    return {
      test_name: cells[nameIndex],
      value: cells[valueIndex],
      unit: cells[unitIndex],
    };
  });
}

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
            key={`${result.test_name}-${result.value}-${result.severity}`}
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
            <p className="mt-2 text-sm leading-6 text-slate-700">{result.explanation}</p>
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-800">
              Suggested next step: {result.suggested_next_step}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [rows, setRows] = useState([
    { test_name: "Hemoglobin", value: "12.9", unit: "g/dL" },
  ]);
  const [csvText, setCsvText] = useState(sampleCsv);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return results.critical.length + results.warning.length + results.normal.length;
  }, [results]);

  function updateRow(index, field, value) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, { test_name: "", value: "", unit: "" }]);
  }

  function removeRow(index) {
    setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index));
  }

  async function analyzeLabs(labs) {
    setError("");
    setResults(null);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labs }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to analyze labs.");
      }

      setResults(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function submitForm(event) {
    event.preventDefault();
    analyzeLabs(rows);
  }

  function submitCsv() {
    try {
      analyzeLabs(parseCsv(csvText));
    } catch (csvError) {
      setError(csvError.message);
    }
  }

  async function loadCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
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

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Manual lab input</h2>
            <form onSubmit={submitForm} className="mt-4 space-y-4">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1.3fr_0.7fr_0.7fr_auto]"
                >
                  <label className="text-sm font-medium text-slate-700">
                    Test name
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={row.test_name}
                      onChange={(event) => updateRow(index, "test_name", event.target.value)}
                      placeholder="Hemoglobin"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Value
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={row.value}
                      onChange={(event) => updateRow(index, "value", event.target.value)}
                      placeholder="12.9"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Unit
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={row.unit}
                      onChange={(event) => updateRow(index, "unit", event.target.value)}
                      placeholder="g/dL"
                    />
                  </label>
                  <button
                    type="button"
                    className="self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Add row
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Analyze form"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">CSV input</h2>
            <p className="mt-1 text-sm text-slate-600">Use headers: test_name,value,unit</p>
            <input type="file" accept=".csv,text/csv" onChange={loadCsvFile} className="mt-4 block w-full text-sm" />
            <textarea
              className="mt-4 min-h-52 w-full rounded-md border border-slate-300 p-3 font-mono text-sm"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
            />
            <button
              onClick={submitCsv}
              className="mt-3 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze CSV"}
            </button>
          </section>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-slate-700">Analyzed {totalResults} result(s)</p>
            <ResultSection title="Critical results" results={results.critical} />
            <ResultSection title="Warning results" results={results.warning} />
            <ResultSection title="Normal results" results={results.normal} />
          </div>
        )}
      </div>
    </main>
  );
}
