import json
import os
from typing import Any, Dict, List, TypedDict

from fastapi import FastAPI, HTTPException
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
ALLOWED_ROLES = {"user", "assistant", "system"}


class OrchestrateRequest(BaseModel):
    lang: str = Field(default="fr")
    message: str = Field(min_length=1)
    history: List[Dict[str, str]] = Field(default_factory=list)


class GraphState(TypedDict, total=False):
    lang: str
    message: str
    history: List[Dict[str, str]]
    plan: Dict[str, Any]
    reply: str


def get_llm(temperature: float = 0.3):
    api_key = os.getenv("GROQ_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GROQ_KEY")

    return ChatOpenAI(
        api_key=api_key,
        model=DEFAULT_MODEL,
        temperature=temperature,
        base_url=GROQ_BASE_URL,
    )


def normalize_history(raw_history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []
    for item in raw_history:
        role = item.get("role") if isinstance(item, dict) else None
        content = item.get("content") if isinstance(item, dict) else None
        if role in ALLOWED_ROLES and isinstance(content, str) and content.strip():
            normalized.append({"role": role, "content": content.strip()})
    return normalized[-8:]


def planner_node(state: GraphState) -> GraphState:
    lang = "en" if state.get("lang") == "en" else "fr"
    llm = get_llm(temperature=0.2)

    prompt = (
        "You are KRL1 PM Orchestrator. Return strict JSON only with keys: "
        "intent, confidence (0-1), user_goal, steps (array of {tool, objective, output}), risks (array), quick_win."
        if lang == "en"
        else "Tu es KRL1 PM Orchestrator. Retourne uniquement du JSON strict avec les clés: "
        "intent, confidence (0-1), user_goal, steps (tableau de {tool, objective, output}), risks (tableau), quick_win."
    )

    history = normalize_history(state.get("history", []))
    user_message = state.get("message", "")

    completion = llm.invoke([
        {"role": "system", "content": prompt},
        *history,
        {"role": "user", "content": user_message},
    ])

    raw = completion.content if isinstance(completion.content, str) else json.dumps(completion.content)
    try:
        plan = json.loads(raw)
    except json.JSONDecodeError:
        plan = {
            "intent": "unknown",
            "confidence": 0.3,
            "user_goal": user_message,
            "steps": [],
            "risks": ["planner_json_parse_error"],
            "quick_win": "Clarifier le besoin en une phrase" if lang == "fr" else "Clarify the goal in one sentence",
            "raw": raw,
        }

    return {"plan": plan}


def synthesis_node(state: GraphState) -> GraphState:
    lang = "en" if state.get("lang") == "en" else "fr"
    llm = get_llm(temperature=0.45)

    prompt = (
        "You are KRL1. Turn this PM plan into a concise, actionable answer (max 220 words). "
        "Include the next step and direct links for named tools."
        if lang == "en"
        else "Tu es KRL1. Transforme ce plan PM en réponse concise et actionnable (max 220 mots). "
        "Ajoute la prochaine action et les liens directs des outils cités."
    )

    tool_links = "\n".join([
        "OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html",
        "Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html",
        "User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html",
        "Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html",
        "Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html",
        "Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html",
    ])

    user_payload = (
        f"User request:\n{state.get('message', '')}\n\n"
        f"Plan JSON:\n{json.dumps(state.get('plan', {}), ensure_ascii=False)}\n\n"
        f"Tools:\n{tool_links}"
    )

    completion = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": user_payload},
    ])

    reply = completion.content if isinstance(completion.content, str) else json.dumps(completion.content, ensure_ascii=False)
    return {"reply": reply}


def build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("planner", planner_node)
    graph.add_node("synthesis", synthesis_node)
    graph.set_entry_point("planner")
    graph.add_edge("planner", "synthesis")
    graph.add_edge("synthesis", END)
    return graph.compile()


app = FastAPI(title="KRL1 LangGraph Orchestrator")
compiled_graph = build_graph()


@app.get("/health")
def health():
    return {"ok": True, "service": "krl1-langgraph-orchestrator"}


@app.post("/orchestrate")
def orchestrate(payload: OrchestrateRequest):
    state: GraphState = {
        "lang": payload.lang,
        "message": payload.message,
        "history": normalize_history(payload.history),
    }

    result = compiled_graph.invoke(state)
    return {
        "reply": result.get("reply", ""),
        "plan": result.get("plan"),
        "engine": "langgraph",
    }
