import { useState } from "react";

const csvSamples = {
  Mixed: `test_name,value,unit
Hemoglobin,11.2,g/dL
Ferritin,220,ug/L
Protein (Strip),Negatif,mg/dL`,
  Normal: `test_name,value,unit
Hemoglobin,12.9,g/dL
Ferritin,28.9,ug/L
Protein (Strip),Negatif,mg/dL`,
  Warning: `test_name,value,unit
Hemoglobin,10.8,g/dL
Ferritin,180,ug/L
Eritrosit (Strip),1+,-`,
  Critical: `test_name,value,unit
Hemoglobin,5.5,g/dL
Ferritin,500,ug/L
pH (Strip),2,-`,
};

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

  return lines.slice(1).map((line, index) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const row = {
      test_name: cells[nameIndex],
      value: cells[valueIndex],
      unit: cells[unitIndex],
    };

    if (!row.test_name || !row.value || !row.unit) {
      throw new Error(`CSV row ${index + 2} has missing test_name, value, or unit.`);
    }

    return row;
  });
}

function Field({ label, value, placeholder, onChange }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function LabInput({ loading, onAnalyze, onError }) {
  const [rows, setRows] = useState([
    { test_name: "Hemoglobin", value: "12.9", unit: "g/dL" },
  ]);
  const [csvText, setCsvText] = useState(csvSamples.Mixed);

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

  function submitForm(event) {
    event.preventDefault();
    onAnalyze(rows);
  }

  function submitCsv() {
    try {
      onAnalyze(parseCsv(csvText));
    } catch (csvError) {
      onError(csvError.message);
    }
  }

  async function loadCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Manual Entry Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Manual Lab Entry</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Enter individual lab test results for analysis
            </p>
          </div>
          {loading && <span className="loader-ring" aria-label="Analyzing form input" />}
        </div>

        <form onSubmit={submitForm} className="mt-5 space-y-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[1.3fr_0.7fr_0.7fr_auto]">
                <Field
                  label="Test name"
                  value={row.test_name}
                  placeholder="Hemoglobin"
                  onChange={(event) => updateRow(index, "test_name", event.target.value)}
                />
                <Field
                  label="Value"
                  value={row.value}
                  placeholder="12.9"
                  onChange={(event) => updateRow(index, "value", event.target.value)}
                />
                <Field
                  label="Unit"
                  value={row.unit}
                  placeholder="g/dL"
                  onChange={(event) => updateRow(index, "unit", event.target.value)}
                />
                <button
                  type="button"
                  className="self-end rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add row
            </button>
            <button
              type="submit"
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-wait disabled:opacity-60"
              disabled={loading}
            >
              {loading && <span className="loader-dot loader-dot-white" />}
              {loading ? "Analyzing..." : "Analyze Results"}
            </button>
          </div>
        </form>
      </section>

      {/* ── CSV Upload Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">CSV Upload</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Upload or paste CSV data with lab results
            </p>
          </div>
          {loading && <span className="loader-ring" aria-label="Analyzing CSV input" />}
        </div>

        {/* Sample buttons */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-slate-500">Quick-load sample data:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(csvSamples).map(([label, sample]) => (
              <button
                key={label}
                type="button"
                onClick={() => setCsvText(sample)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Drag-and-drop styled upload zone */}
        <div className="mt-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
          <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-slate-600">Upload CSV file</p>
          <p className="mt-0.5 text-xs text-slate-400">Required headers: test_name, value, unit</p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={loadCsvFile}
            className="mt-3 block w-full text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 file:transition hover:file:bg-blue-100"
          />
        </div>

        {/* CSV textarea */}
        <textarea
          className="mt-4 min-h-44 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
        />

        <button
          onClick={submitCsv}
          className="mt-3 inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-wait disabled:opacity-60"
          disabled={loading}
        >
          {loading && <span className="loader-dot loader-dot-white" />}
          {loading ? "Analyzing..." : "Analyze CSV"}
        </button>
      </section>
    </div>
  );
}
