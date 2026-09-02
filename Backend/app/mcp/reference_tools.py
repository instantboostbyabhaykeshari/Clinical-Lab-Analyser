import csv
from functools import lru_cache
from pathlib import Path
from typing import Any

from langsmith import traceable


DATASET_PATH = (
    Path(__file__).resolve().parents[3]
    / "test_data"
    / "data"
    / "lab_test_results_public.csv"
)


def _normalize_test_name(test_name: str) -> str:
    return test_name.strip().casefold()


@lru_cache
def load_reference_ranges() -> dict[str, dict[str, Any]]:
    ranges: dict[str, dict[str, Any]] = {}

    with DATASET_PATH.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            test_name = row["Test_Name"].strip()
            ranges[_normalize_test_name(test_name)] = {
                "test_name": test_name,
                "unit": row["Unit"].strip(),
                "reference_range": row["Reference_Range"].strip(),
                "min_reference": _to_float_or_none(row.get("Min_Reference", "")),
                "max_reference": _to_float_or_none(row.get("Max_Reference", "")),
                "recommended_followup": row["Recommended_Followup"].strip(),
            }

    return ranges


@traceable(
    name="reference_range_lookup_dataset",
    run_type="tool",
    tags=["clinical-lab-analyzer", "dataset", "reference-range"],
)
def reference_range_lookup(test_name: str) -> dict[str, Any] | None:
    return load_reference_ranges().get(_normalize_test_name(test_name))


def _to_float_or_none(value: str | None) -> float | None:
    if value is None or value.strip() == "":
        return None
    return float(value)
