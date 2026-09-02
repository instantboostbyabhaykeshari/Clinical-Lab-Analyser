from fastapi import FastAPI

app = FastAPI(title="Clinical Lab Results Analyzer")


@app.get("/")
def root():
    return {
        "message": "Clinical Lab Results Analyzer backend is running"
    }