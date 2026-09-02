import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.agents.lab_graph import lab_analysis_graph, stream_lab_analysis_events
from app.models.lab import AnalyzeLabsRequest, AnalyzeLabsResponse

app = FastAPI(title="Clinical Lab Results Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Clinical Lab Results Analyzer backend is running"
    }


@app.post("/analyze_labs", response_model=AnalyzeLabsResponse)
def analyze_labs(request: AnalyzeLabsRequest):
    try:
        result = lab_analysis_graph.invoke(
            {"labs": request.labs, "classified": [], "routed": {}}
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    routed = result["routed"]
    return {
        "critical": routed["Critical"],
        "warning": routed["Warning"],
        "normal": routed["Normal"],
    }


@app.post("/analyze_labs/stream")
def analyze_labs_stream(request: AnalyzeLabsRequest):
    def event_stream():
        try:
            for event in stream_lab_analysis_events(request.labs):
                yield json.dumps(event, ensure_ascii=False) + "\n"
        except ValueError as error:
            yield json.dumps({"event": "error", "detail": str(error)}) + "\n"
        except Exception:
            yield json.dumps(
                {
                    "event": "error",
                    "detail": "Unable to stream lab analysis right now.",
                }
            ) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
