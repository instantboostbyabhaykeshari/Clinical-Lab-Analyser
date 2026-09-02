import { useState } from "react";

const sampleCsv = `test_name,value,unit
Hemoglobin,11.2,g/dL
Ferritin,220,ug/L
Protein (Strip),Negatif,mg/dL`;

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

export default function LabInput({ loading, onAnalyze, onError }) {
  const [rows, setRows] = useState([
    { test_name: "Hemoglobin", value: "12.9", unit: "g/dL" },
  ]);
  const [csvText, setCsvText] = useState(sampleCsv);

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
  );
}
