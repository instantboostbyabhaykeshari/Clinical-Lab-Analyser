from typing import Iterator, TypedDict

from langgraph.graph import END, StateGraph

from app.models.lab import LabResultInput
from app.services.classifier import classify_lab_result
from app.services.llm_service import explain_lab_result, explain_lab_result_stream


class LabGraphState(TypedDict):
    labs: list[LabResultInput]
    classified: list[dict]
    routed: dict[str, list[dict]]


def classify_node(state: LabGraphState) -> LabGraphState:
    return {
        **state,
        "classified": [classify_lab_result(lab) for lab in state["labs"]],
    }


def route_node(state: LabGraphState) -> LabGraphState:
    routed = {"Critical": [], "Warning": [], "Normal": []}
    for result in state["classified"]:
        routed[result["severity"]].append(result)

    return {**state, "routed": routed}


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
