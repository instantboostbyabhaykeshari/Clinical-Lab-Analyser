# Clinical Lab Results Analyzer

A GenAI full-stack application that analyzes clinical lab results, classifies each result as `Normal`, `Warning`, or `Critical`, groups results by severity, and streams cautious AI explanations to the frontend.

This project was built for the GenAI + Full-Stack assignment using FastAPI, LangGraph, LangChain, Google Gemini, MCP, LangSmith, and Next.js.

## Features

- Manual lab-result input from the frontend
- CSV input for batch lab analysis
- Reference-range lookup from the included lab dataset
- Rule-based classification for deterministic comparison
- Gemini-powered AI classification through LangChain
- LangGraph workflow for classify, route, and explain steps
- Streaming AI explanations through `/analyze_labs/stream`
- Severity-grouped results: Critical first, then Warning, then Normal
- MCP reference-range lookup tool
- LangSmith tracing hooks for debugging and evaluation
- Dark-themed Next.js dashboard UI

## Tech Stack

- Frontend: Next.js, React, JavaScript, Tailwind CSS
- Backend: Python, FastAPI, Pydantic
- AI orchestration: LangGraph
- LLM framework: LangChain
- AI provider: Google Gemini
- Tool protocol: MCP
- Observability/testing traces: LangSmith
- Dataset: `test_data/data/lab_test_results_public.csv`

## AI Provider Chosen

The selected AI provider is Google Gemini, used through `langchain-google-genai`.

Gemini is used for two AI tasks:

1. Classification: the backend sends the lab value, unit, reference range, and rule-based result to Gemini and asks it to return exactly one label: `Normal`, `Warning`, or `Critical`.
2. Explanation: for each result, Gemini generates a short educational explanation. The prompt is intentionally cautious and avoids diagnosis.

If `GEMINI_API_KEY` is missing or the LLM call fails, the backend falls back safely instead of crashing.

## Architecture

```text
Next.js Frontend
  |
  | POST /analyze_labs/stream
  v
FastAPI Backend
  |
  v
Pydantic Request Validation
  |
  v
LangGraph Workflow
  |
  |-- classify node
  |     |-- MCP reference-range lookup
  |     |-- rule-based classification
  |     |-- Gemini AI classification
  |
  |-- route node
  |     |-- groups into Critical, Warning, Normal
  |
  |-- explain node / streaming explanation
        |-- Gemini explanation via LangChain
        |-- streamed back as NDJSON events
```

## Backend Flow

1. The frontend sends lab rows as JSON.
2. FastAPI validates the request using Pydantic models.
3. LangGraph starts the workflow.
4. The classify step looks up reference ranges through MCP.
5. The deterministic classifier compares the result against the reference range.
6. Gemini receives the rule-based result and returns the AI classification.
7. The route step groups results into `Critical`, `Warning`, and `Normal`.
8. The explanation step generates safe educational text.
9. The streaming endpoint returns progress events and explanation chunks to the frontend.

## Project Structure

```text
Backend/
  app/
    agents/
      lab_graph.py          LangGraph workflow
    mcp/
      server.py             MCP server
      client.py             MCP client used by backend
      reference_tools.py    Dataset-backed reference lookup
    models/
      lab.py                Pydantic request/response models
    services/
      classifier.py         Rule-based classification
      llm_service.py        Gemini + LangSmith logic
    main.py                 FastAPI app and API routes
  tests/
    test_analyze_labs.py    Backend tests
  requirements.txt

clinical_app/
  app/
    page.js                 Main Next.js page
    globals.css             Dark theme and loaders
  components/
    LabInput.jsx            Manual and CSV input UI
    ResultsDisplay.jsx      Severity-grouped output UI
    SeverityBadge.jsx       Status badge UI
  services/
    api.js                  Frontend API client and streaming reader

test_data/
  normal.csv
  warning.csv
  critical.csv
  data/
    lab_test_results_public.csv
```

## Environment Variables

Create `Backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash

LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=Clinical Lab Analyzer
```

`GEMINI_API_KEY` is required for live Gemini calls. LangSmith variables are optional but recommended for tracing and testing each backend step.

## Backend Setup

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\clinical_app
npm.cmd install
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:3000
```

## API Endpoints

### Health Check

```text
GET /
```

Returns a simple backend-running message.

### LLM Health Check

```text
GET /test-llm
```

Checks whether Gemini is configured and reachable.

### LangSmith Config Check

```text
GET /test-langsmith
```

Returns whether LangSmith tracing is enabled and whether the API key is configured. It does not expose the API key.

### Analyze Labs

```text
POST /analyze_labs
```

Example request:

```json
{
  "labs": [
    {
      "test_name": "Hemoglobin",
      "value": "10.8",
      "unit": "g/dL"
    },
    {
      "test_name": "Ferritin",
      "value": "500",
      "unit": "ug/L"
    }
  ]
}
```

Example response shape:

```json
{
  "critical": [],
  "warning": [],
  "normal": []
}
```

### Streaming Analyze Labs

```text
POST /analyze_labs/stream
```

Returns newline-delimited JSON events. The frontend reads these events progressively and displays the explanation like a chat response.

Common event types:

- `stage`
- `result_start`
- `explanation_delta`
- `result_end`
- `complete`
- `error`

## MCP

This project includes an MCP server for reference-range lookup.

Run the MCP server directly:

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\Backend
.\.venv\Scripts\Activate.ps1
python -m app.mcp.server
```

The MCP tool is:

```text
lookup_reference_range(test_name)
```

It reads from:

```text
test_data/data/lab_test_results_public.csv
```

The backend calls MCP through `Backend/app/mcp/client.py`. If the MCP call fails, the backend falls back to direct dataset lookup.

## LangSmith

LangSmith tracing is added around the important backend steps:

- MCP reference-range lookup
- Rule-based classification
- Gemini AI classification
- LangGraph classify node
- LangGraph route node
- LangGraph explain node
- Streaming explanation flow
- LLM health check
- LangSmith configuration check

To confirm configuration:

```powershell
curl.exe http://127.0.0.1:8000/test-langsmith
```

## How To Test

### Backend Unit Tests

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\Backend
.\.venv\Scripts\Activate.ps1
python -m unittest discover -s tests
```

### Frontend Build Test

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\clinical_app
npm.cmd run build
```

### Manual End-to-End Test

Start backend:

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\Backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Start frontend in a second terminal:

```powershell
cd C:\Abhay\PDFfiles\Desktop\Aragen\clinical_app
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

Manual input example:

```text
Test name: Ferritin
Value: 500
Unit: ug/L
```

CSV example:

```csv
test_name,value,unit
Hemoglobin,10.8,g/dL
Ferritin,500,ug/L
Protein (Strip),Negatif,mg/dL
```

Expected behavior:

- Results are grouped by severity.
- Critical results appear before Warning and Normal.
- Result cards appear before the full explanation is complete.
- AI explanation streams progressively.
- The UI shows loading indicators while analysis is running.

## Test Data

Sample CSV files are included:

- `test_data/normal.csv`
- `test_data/warning.csv`
- `test_data/critical.csv`

The reference dataset is:

- `test_data/data/lab_test_results_public.csv`

## Medical Safety Note

This application is for an educational software assignment. It is not a diagnostic system and must not be used as medical advice. AI explanations are intentionally cautious and should recommend discussion with a qualified healthcare professional for abnormal results.

## Author

Copyright (c) 2026. Made by Abhay.
