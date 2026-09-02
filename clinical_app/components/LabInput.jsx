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
    <label className="text-sm font-medium text-slate-300">
      <span>{label}</span>
      <input
        className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
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
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Form input</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-50">Manual lab entry</h2>
          </div>
          {loading && <span className="loader-ring" aria-label="Analyzing form input" />}
        </div>

        <form onSubmit={submitForm} className="mt-4 space-y-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-slate-800 bg-slate-900/55 p-3 sm:grid-cols-[1.3fr_0.7fr_0.7fr_auto]"
            >
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
                className="self-end rounded-md border border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:bg-cyan-500/10"
            >
              Add row
            </button>
            <button
              type="submit"
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-70"
              disabled={loading}
            >
              {loading && <span className="loader-dot loader-dot-dark" />}
              {loading ? "Analyzing..." : "Analyze form"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Batch input</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-50">CSV analysis</h2>
            <p className="mt-1 text-sm text-slate-400">Required headers: test_name,value,unit</p>
          </div>
          {loading && <span className="loader-ring" aria-label="Analyzing CSV input" />}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(csvSamples).map(([label, sample]) => (
            <button
              key={label}
              type="button"
              onClick={() => setCsvText(sample)}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-100 disabled:opacity-50"
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={loadCsvFile}
          className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700"
        />
        <textarea
          className="mt-4 min-h-52 w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
        />
        <button
          onClick={submitCsv}
          className="mt-3 inline-flex min-w-36 items-center justify-center gap-2 rounded-md bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
          disabled={loading}
        >
          {loading && <span className="loader-dot loader-dot-dark" />}
          {loading ? "Analyzing..." : "Analyze CSV"}
        </button>
      </section>
    </div>
  );
}
