from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.models.lab import LabResultInput
from app.services.classifier import classify_lab_result
from app.services.llm_service import explain_lab_result


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


lab_analysis_graph = build_lab_analysis_graph()
