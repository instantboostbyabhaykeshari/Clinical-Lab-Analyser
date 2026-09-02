from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agents.lab_graph import lab_analysis_graph
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
