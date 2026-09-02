# import os

# from dotenv import load_dotenv
# from langchain_core.messages import HumanMessage, SystemMessage
# from langchain_google_genai import ChatGoogleGenerativeAI


# load_dotenv()

# SYSTEM_PROMPT = (
#     "You explain clinical lab results for an educational software assignment. "
#     "Do not diagnose. Use cautious language. Explain why the value was flagged, "
#     "what it can generally mean, and advise discussing abnormal findings with a "
#     "qualified healthcare professional."
# )


# def generate_llm_health_check() -> str:
#     api_key = os.getenv("GEMINI_API_KEY")
#     if not api_key:
#         raise ValueError("GEMINI_API_KEY is not configured")

#     model = ChatGoogleGenerativeAI(
#         model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
#         google_api_key=api_key,
#     )

#     response = model.invoke(
#         [
#             SystemMessage(content=SYSTEM_PROMPT),
#             HumanMessage(
#                 content=(
#                     "Reply in one short sentence confirming that you can generate "
#                     "cautious educational lab-result explanations."
#                 )
#             ),
#         ],
#         config={
#             "run_name": "gemini_health_check",
#             "tags": ["clinical-lab-analyzer", "health-check"],
#             "metadata": {"feature": "llm_health_check"},
#         },
#     )
#     return str(response.content)


# def get_langsmith_status() -> dict:
#     return {
#         "tracing_enabled": os.getenv("LANGSMITH_TRACING", "").lower() == "true",
#         "api_key_configured": bool(os.getenv("LANGSMITH_API_KEY")),
#         "project": os.getenv("LANGSMITH_PROJECT", "default"),
#         "endpoint": os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"),
#     }


# def explain_lab_result(result: dict) -> str:
#     if result["severity"] == "Normal":
#         return "This result is within the configured reference range. Continue routine follow-up as appropriate."

#     api_key = os.getenv("GEMINI_API_KEY")
#     if not api_key:
#         return (
#             "LLM explanation unavailable because GEMINI_API_KEY is not configured. "
#             f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
#         )

#     model = ChatGoogleGenerativeAI(
#         model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
#         google_api_key=api_key,
#     )

#     prompt = (
#         f"Lab test: {result['test_name']}\n"
#         f"Result: {result['value']} {result['unit']}\n"
#         f"Reference range: {result['reference_range']}\n"
#         f"Severity: {result['severity']}\n"
#         f"Deterministic reason: {result['reason']}\n"
#         "Write 2-3 short sentences. Include no definitive diagnosis."
#     )

#     try:
#         response = model.invoke(
#             [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)],
#             config=_trace_config(result, "lab_result_explanation"),
#         )
#     except Exception:
#         return (
#             "AI explanation is temporarily unavailable. "
#             f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
#         )

#     return str(response.content)


# def explain_lab_result_stream(result: dict):
#     if result["severity"] == "Normal":
#         yield "This result is within the configured reference range. Continue routine follow-up as appropriate."
#         return

#     api_key = os.getenv("GEMINI_API_KEY")
#     if not api_key:
#         yield (
#             "LLM explanation unavailable because GEMINI_API_KEY is not configured. "
#             f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
#         )
#         return

#     model = ChatGoogleGenerativeAI(
#         model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
#         google_api_key=api_key,
#     )

#     prompt = (
#         f"Lab test: {result['test_name']}\n"
#         f"Result: {result['value']} {result['unit']}\n"
#         f"Reference range: {result['reference_range']}\n"
#         f"Severity: {result['severity']}\n"
#         f"Deterministic reason: {result['reason']}\n"
#         "Write 2-3 short sentences. Include no definitive diagnosis."
#     )

#     try:
#         for chunk in model.stream(
#             [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)],
#             config=_trace_config(result, "lab_result_explanation_stream"),
#         ):
#             content = _chunk_to_text(chunk.content)
#             if content:
#                 yield content
#     except Exception:
#         yield (
#             "AI explanation is temporarily unavailable. "
#             f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
#         )


# def _chunk_to_text(content) -> str:
#     if isinstance(content, str):
#         return content
#     if isinstance(content, list):
#         return "".join(
#             item.get("text", "") if isinstance(item, dict) else str(item)
#             for item in content
#         )
#     return str(content)


# def _trace_config(result: dict, run_name: str) -> dict:
#     return {
#         "run_name": run_name,
#         "tags": ["clinical-lab-analyzer", result["severity"].lower()],
#         "metadata": {
#             "test_name": result["test_name"],
#             "severity": result["severity"],
#             "reference_range": result["reference_range"],
#         },
#     }




import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langsmith import traceable


load_dotenv()

SYSTEM_PROMPT = (
    "You explain clinical lab results for an educational software assignment. "
    "You are not a diagnostic tool: never state or imply a diagnosis, and never "
    "say phrases like 'this means you have'. Ground every explanation strictly "
    "in the value, reference range, and severity provided to you — never invent "
    "labs, symptoms, or history you were not given. For each abnormal result, "
    "cover three things: (1) the direction and rough magnitude of the deviation "
    "from the reference range (e.g. mildly, moderately, or markedly above/below "
    "normal), (2) the body system or physiological process most commonly "
    "associated with this type of abnormality, and (3) one or two commonly "
    "associated possible causes, hedged with language like 'can be associated "
    "with' or 'may indicate' rather than stated as fact. If the value is only "
    "marginally outside the reference range, say so explicitly rather than "
    "sounding alarming. If the severity is Critical, be direct and factual about "
    "urgency without inducing panic. Always close by advising the reader to "
    "discuss the result with a qualified healthcare professional."
)

CLASSIFICATION_SYSTEM_PROMPT = (
    "You classify lab results for an educational software assignment. "
    "Use only the provided lab value, unit, reference range, and deterministic "
    "reference-range assessment. Do not diagnose. Return exactly one label: "
    "Normal, Warning, or Critical."
)

VALID_CLASSIFICATIONS = {"Normal", "Warning", "Critical"}


@traceable(
    name="llm_health_check",
    run_type="llm",
    tags=["clinical-lab-analyzer", "gemini", "health-check"],
)
def generate_llm_health_check() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")

    model = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        google_api_key=api_key,
    )

    response = model.invoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    "Reply in one short sentence confirming that you can generate "
                    "cautious educational lab-result explanations."
                )
            ),
        ],
        config={
            "run_name": "gemini_health_check",
            "tags": ["clinical-lab-analyzer", "health-check"],
            "metadata": {"feature": "llm_health_check"},
        },
    )
    return str(response.content)


@traceable(
    name="langsmith_status_check",
    run_type="tool",
    tags=["clinical-lab-analyzer", "langsmith"],
)
def get_langsmith_status() -> dict:
    return {
        "tracing_enabled": os.getenv("LANGSMITH_TRACING", "").lower() == "true",
        "api_key_configured": bool(os.getenv("LANGSMITH_API_KEY")),
        "project": os.getenv("LANGSMITH_PROJECT", "default"),
        "endpoint": os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"),
    }


@traceable(
    name="llm_classify_lab_result",
    run_type="llm",
    tags=["clinical-lab-analyzer", "gemini", "classification"],
)
def classify_lab_result_with_llm(result: dict) -> str:
    fallback = result["severity"]
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback

    model = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        google_api_key=api_key,
    )

    prompt = (
        f"Lab test: {result['test_name']}\n"
        f"Result: {result['value']} {result['unit']}\n"
        f"Reference range: {result['reference_range']}\n"
        f"Rule-based classification: {result['severity']}\n"
        f"Rule-based reason: {result['reason']}\n\n"
        "Classify this lab result as exactly one of: Normal, Warning, Critical. "
        "Return only the label."
    )

    try:
        response = model.invoke(
            [
                SystemMessage(content=CLASSIFICATION_SYSTEM_PROMPT),
                HumanMessage(content=prompt),
            ],
            config=_trace_config(result, "lab_result_ai_classification"),
        )
    except Exception:
        return fallback

    return _extract_classification(str(response.content), fallback)


def _build_prompt(result: dict) -> str:
    return (
        f"Lab test: {result['test_name']}\n"
        f"Result: {result['value']} {result['unit']}\n"
        f"Reference range: {result['reference_range']}\n"
        f"Severity: {result['severity']}\n"
        f"Deterministic reason: {result['reason']}\n\n"
        "Write 3-4 short sentences covering: the direction/magnitude of the "
        "deviation from the reference range, the body system most commonly "
        "involved, one or two hedged possible causes, and a brief, "
        "non-prescriptive next step. Include no definitive diagnosis."
    )


@traceable(
    name="explain_lab_result",
    run_type="llm",
    tags=["clinical-lab-analyzer", "gemini", "explanation"],
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

    prompt = _build_prompt(result)

    try:
        response = model.invoke(
            [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)],
            config=_trace_config(result, "lab_result_explanation"),
        )
    except Exception:
        return (
            "AI explanation is temporarily unavailable. "
            f"{result['reason']} Consider discussing this result with a qualified healthcare professional."
        )

    return str(response.content)


@traceable(
    name="explain_lab_result_stream",
    run_type="llm",
    tags=["clinical-lab-analyzer", "gemini", "streaming"],
)
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

    prompt = _build_prompt(result)

    try:
        for chunk in model.stream(
            [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)],
            config=_trace_config(result, "lab_result_explanation_stream"),
        ):
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


def _extract_classification(text: str, fallback: str) -> str:
    cleaned = text.strip().replace(".", "")
    for classification in VALID_CLASSIFICATIONS:
        if cleaned.casefold() == classification.casefold():
            return classification
    for classification in VALID_CLASSIFICATIONS:
        if classification.casefold() in cleaned.casefold():
            return classification
    return fallback


def _trace_config(result: dict, run_name: str) -> dict:
    return {
        "run_name": run_name,
        "tags": ["clinical-lab-analyzer", result["severity"].lower()],
        "metadata": {
            "test_name": result["test_name"],
            "severity": result["severity"],
            "reference_range": result["reference_range"],
        },
    }
