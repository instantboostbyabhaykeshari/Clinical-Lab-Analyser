from typing import Literal
from pydantic import BaseModel, Field, field_validator

Severity = Literal["Critical", "Warning", "Normal"]


class LabResultInput(BaseModel):
    test_name: str = Field(..., min_length=1, examples=["Hemoglobin"])
    value: str = Field(..., min_length=1, examples=["12.9"])
    unit: str = Field(..., min_length=1, examples=["g/dL"])

    @field_validator("test_name", "value", "unit")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank")
        return cleaned


class AnalyzeLabsRequest(BaseModel):
    labs: list[LabResultInput] = Field(..., min_length=1)


class AnalyzedLabResult(BaseModel):
    test_name: str
    value: str
    unit: str
    reference_range: str
    severity: Severity
    reason: str
    explanation: str
    suggested_next_step: str


class AnalyzeLabsResponse(BaseModel):
    critical: list[AnalyzedLabResult]
    warning: list[AnalyzedLabResult]
    normal: list[AnalyzedLabResult]
