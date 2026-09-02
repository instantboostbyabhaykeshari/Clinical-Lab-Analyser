# Clinical Lab Results Analyzer

A GenAI full-stack assignment for classifying lab results, routing them by severity, and explaining abnormal results with cautious AI-generated language.

## Stack

- Backend: Python, FastAPI, Pydantic
- Agent workflow: LangGraph
- LLM integration: LangChain + Gemini
- Tooling: MCP reference range server
- Frontend: Next.js / React
- Dataset: Kaggle Laboratory Test Results - Anonymized Dataset

## Architecture

```text
React / Next.js
  -> POST /analyze_labs
  -> FastAPI validation
  -> LangGraph: classify -> route -> explain
  -> MCP reference_range_lookup tool data
  -> LangChain Gemini explanation
  -> grouped response: critical, warning, normal
```

Classification starts with deterministic reference-range logic from `test_data/data/lab_test_results_public.csv`, then Gemini is called through LangChain to produce the final Normal / Warning / Critical classification. The response keeps both the AI classification and the rule-based classification for explainability and auditability. Gemini is also used for educational explanations, not diagnosis.

## Backend Setup

```powershell
cd Backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `Backend/.env`:

```txt
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash
```

Run:

```powershell
uvicorn app.main:app --reload
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

```powershell
cd clinical_app
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## API Example

```json
{
  "labs": [
    { "test_name": "Hemoglobin", "value": "11.2", "unit": "g/dL" },
    { "test_name": "Ferritin", "value": "220", "unit": "ug/L" }
  ]
}
```

Send to:

```text
POST http://127.0.0.1:8000/analyze_labs
```

## MCP Server

The MCP server exposes a `lookup_reference_range(test_name)` tool:

```powershell
cd Backend
python -m app.mcp.server
```

## LangSmith Tracing

Set these values in `Backend/.env` to trace each major backend step:

```txt
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key_here
LANGSMITH_PROJECT=Clinical Lab Analyzer
```

The project traces the MCP lookup, classification step, routing step, explanation step, Gemini calls, and streaming endpoint. Use `/test-langsmith` to confirm the backend sees the tracing configuration.

## Test Data

Synthetic CSV files are available in `test_data/`:

- `normal.csv`
- `warning.csv`
- `critical.csv`

Each uses:

```csv
test_name,value,unit
```

## Medical Safety

This project is not a diagnostic system. AI explanations are educational and should recommend discussion with a qualified healthcare professional for abnormal results.
