import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()

SYSTEM_PROMPT = (
    "You explain clinical lab results for an educational software assignment. "
    "Do not diagnose. Use cautious language. Explain why the value was flagged, "
    "what it can generally mean, and advise discussing abnormal findings with a "
    "qualified healthcare professional."
)


def explain_lab_result(result: dict) -> str:
    if result["severity"] == "Normal":
        return "This result is within the configured reference range. Continue routine follow-up as appropriate."

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return (
            "LLM explanation unavailable because GEMINI_API_KEY is not configured. "
            f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
        )

    model = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        google_api_key=api_key,
    )

    prompt = (
        f"Lab test: {result['test_name']}\n"
        f"Result: {result['value']} {result['unit']}\n"
        f"Reference range: {result['reference_range']}\n"
        f"Severity: {result['severity']}\n"
        f"Deterministic reason: {result['reason']}\n"
        "Write 2-3 short sentences. Include no definitive diagnosis."
    )

    try:
        response = model.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)])
    except Exception:
        return (
            "AI explanation is temporarily unavailable. "
            f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
        )

    return str(response.content)


def explain_lab_result_stream(result: dict):
    if result["severity"] == "Normal":
        yield "This result is within the configured reference range. Continue routine follow-up as appropriate."
        return

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        yield (
            "LLM explanation unavailable because GEMINI_API_KEY is not configured. "
            f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
        )
        return

    model = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        google_api_key=api_key,
    )

    prompt = (
        f"Lab test: {result['test_name']}\n"
        f"Result: {result['value']} {result['unit']}\n"
        f"Reference range: {result['reference_range']}\n"
        f"Severity: {result['severity']}\n"
        f"Deterministic reason: {result['reason']}\n"
        "Write 2-3 short sentences. Include no definitive diagnosis."
    )

    try:
        for chunk in model.stream([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)]):
            content = _chunk_to_text(chunk.content)
            if content:
                yield content
    except Exception:
        yield (
            "AI explanation is temporarily unavailable. "
            f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
        )


def _chunk_to_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in content
        )
    return str(content)
