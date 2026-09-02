from typing import Iterator, TypedDict

from langgraph.graph import END, StateGraph
from langsmith import traceable

from app.mcp.client import lookup_reference_range_via_mcp
from app.models.lab import LabResultInput
from app.services.classifier import classify_lab_result
from app.services.llm_service import (
    classify_lab_result_with_llm,
    explain_lab_result,
    explain_lab_result_stream,
)


class LabGraphState(TypedDict):
    labs: list[LabResultInput]
    classified: list[dict]
    routed: dict[str, list[dict]]


@traceable(
    name="langgraph_step_classify",
    run_type="chain",
    tags=["clinical-lab-analyzer", "langgraph", "classify"],
)
def classify_node(state: LabGraphState) -> LabGraphState:
    classified = []
    for lab in state["labs"]:
        reference = lookup_reference_range_via_mcp(lab.test_name)
        result = classify_lab_result(lab, reference)
        rule_based_severity = result["severity"]
        ai_classification = classify_lab_result_with_llm(result)
        result["rule_based_severity"] = rule_based_severity
        result["ai_classification"] = ai_classification
        result["severity"] = ai_classification
        result["classification_source"] = (
            "Gemini LLM classification"
            if ai_classification != rule_based_severity
            else "Gemini LLM classification confirmed rule-based result"
        )
        classified.append(result)

    return {
        **state,
        "classified": classified,
    }


@traceable(
    name="langgraph_step_route",
    run_type="chain",
    tags=["clinical-lab-analyzer", "langgraph", "route"],
)
def route_node(state: LabGraphState) -> LabGraphState:
    routed = {"Critical": [], "Warning": [], "Normal": []}
    for result in state["classified"]:
        routed[result["severity"]].append(result)

    return {**state, "routed": routed}


@traceable(
    name="langgraph_step_explain",
    run_type="chain",
    tags=["clinical-lab-analyzer", "langgraph", "explain"],
)
def explain_node(state: LabGraphState) -> LabGraphState:
    routed = state["routed"]
    for severity in ("Critical", "Warning", "Normal"):
        for result in routed[severity]:
            result["explanation"] = explain_lab_result(result)

    return {**state, "routed": routed}


def build_lab_analysis_graph():
    graph = StateGraph(LabGraphState)
    graph.add_node("classify", classify_node)
    graph.add_node("route", route_node)
    graph.add_node("explain", explain_node)
    graph.set_entry_point("classify")
    graph.add_edge("classify", "route")
    graph.add_edge("route", "explain")
    graph.add_edge("explain", END)
    return graph.compile()


@traceable(
    name="stream_lab_analysis_events",
    run_type="chain",
    tags=["clinical-lab-analyzer", "streaming", "langgraph"],
)
def stream_lab_analysis_events(labs: list[LabResultInput]) -> Iterator[dict]:
    state: LabGraphState = {"labs": labs, "classified": [], "routed": {}}

    state = classify_node(state)
    yield {"event": "stage", "stage": "classify", "message": "Classification complete"}

    state = route_node(state)
    yield {"event": "stage", "stage": "route", "message": "Routing complete"}

    for severity in ("Critical", "Warning", "Normal"):
        for index, result in enumerate(state["routed"][severity]):
            result_id = f"{severity}-{index}-{result['test_name']}-{result['value']}"
            result["explanation"] = ""
            yield {"event": "result_start", "result_id": result_id, "result": result}

            for delta in explain_lab_result_stream(result):
                result["explanation"] += delta
                yield {
                    "event": "explanation_delta",
                    "result_id": result_id,
                    "severity": severity,
                    "test_name": result["test_name"],
                    "delta": delta,
                }

            yield {"event": "result_end", "result_id": result_id, "result": result}

    yield {
        "event": "complete",
        "results": {
            "critical": state["routed"]["Critical"],
            "warning": state["routed"]["Warning"],
            "normal": state["routed"]["Normal"],
        },
    }


lab_analysis_graph = build_lab_analysis_graph()
