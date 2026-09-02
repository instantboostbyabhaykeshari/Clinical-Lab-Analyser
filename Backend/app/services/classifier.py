from langsmith import traceable

from app.mcp.reference_tools import reference_range_lookup
from app.models.lab import LabResultInput


@traceable(
    name="classify_lab_result",
    run_type="chain",
    tags=["clinical-lab-analyzer", "classification"],
)
def classify_lab_result(lab: LabResultInput, reference: dict | None = None) -> dict:
    reference = reference or reference_range_lookup(lab.test_name)
    if reference is None:
        raise ValueError(f"Unknown lab test name: {lab.test_name}")

    if reference["min_reference"] is not None and reference["max_reference"] is not None:
        return _classify_numeric_lab(lab, reference)

    return _classify_text_lab(lab, reference)


@traceable(
    name="classify_numeric_lab",
    run_type="chain",
    tags=["clinical-lab-analyzer", "classification", "numeric"],
)
def _classify_numeric_lab(lab: LabResultInput, reference: dict) -> dict:
    try:
        result_value = float(lab.value)
    except ValueError as exc:
        raise ValueError(f"{lab.test_name} requires a numeric value") from exc

    min_reference = reference["min_reference"]
    max_reference = reference["max_reference"]
    reference_range = reference["reference_range"]

    if min_reference <= result_value <= max_reference:
        severity = "Normal"
        reason = (
            f"{lab.value} {lab.unit} is within the configured reference range "
            f"of {reference_range} {reference['unit']}."
        )
    else:
        distance = _distance_from_range(result_value, min_reference, max_reference)
        severity = "Critical" if distance >= 0.5 else "Warning"
        direction = "below" if result_value < min_reference else "above"
        reason = (
            f"{lab.value} {lab.unit} is {direction} the configured reference "
            f"range of {reference_range} {reference['unit']}."
        )

    return _base_result(lab, reference, severity, reason)


@traceable(
    name="classify_text_lab",
    run_type="chain",
    tags=["clinical-lab-analyzer", "classification", "text"],
)
def _classify_text_lab(lab: LabResultInput, reference: dict) -> dict:
    expected_value = reference["reference_range"]
    is_normal = lab.value.strip().casefold() == expected_value.casefold()
    severity = "Normal" if is_normal else "Warning"
    reason = (
        f"{lab.value} was compared with the configured expected result "
        f"of {expected_value}."
    )

    return _base_result(lab, reference, severity, reason)


def _base_result(lab: LabResultInput, reference: dict, severity: str, reason: str) -> dict:
    return {
        "test_name": reference["test_name"],
        "value": lab.value,
        "unit": lab.unit,
        "reference_range": reference["reference_range"],
        "severity": severity,
        "reason": reason,
        "suggested_next_step": reference["recommended_followup"],
    }


def _distance_from_range(value: float, minimum: float, maximum: float) -> float:
    width = max(maximum - minimum, 1.0)
    if value < minimum:
        return (minimum - value) / width
    return (value - maximum) / width
