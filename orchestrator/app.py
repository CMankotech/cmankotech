import json
import os
from typing import Any, Dict, List, TypedDict

from fastapi import FastAPI, HTTPException
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")


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


ALLOWED_HISTORY_ROLES = {"user", "assistant", "system"}


def normalize_history(history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []
    for item in history:
        if not isinstance(item, dict):
            continue

        role = str(item.get("role", "")).strip()
        content = str(item.get("content", "")).strip()
        if role not in ALLOWED_HISTORY_ROLES or not content:
            continue

        normalized.append({"role": role, "content": content})

    return normalized


def parse_planner_json(raw: str, *, lang: str, user_message: str) -> Dict[str, Any]:
    cleaned_raw = raw.strip()

    if cleaned_raw.startswith("```"):
        lines = cleaned_raw.splitlines()
        if len(lines) >= 3:
            cleaned_raw = "\n".join(lines[1:-1]).strip()

    try:
        return json.loads(cleaned_raw)
    except json.JSONDecodeError:
        return {
            "intent": "unknown",
            "confidence": 0.3,
            "user_goal": user_message,
            "steps": [],
            "risks": ["planner_json_parse_error"],
            "quick_win": "Clarifier le besoin en une phrase" if lang == "fr" else "Clarify the goal in one sentence",
            "raw": raw,
        }


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


def planner_node(state: GraphState) -> GraphState:
    lang = "en" if state.get("lang") == "en" else "fr"
    llm = get_llm(temperature=0.2)

    prompt = (
        "You are KRL1, portfolio assistant for Carlin Mankoto (AI Product Manager). "
        "Analyse the user intent and return strict JSON only. "
        "Intent values: 'pm_workflow' (backlog/OKR/discovery/roadmap/epic/userStory questions), "
        "'portfolio' (Carlin profile/experience/certifications), "
        "'tech' (stack/architecture/KRL1 technical questions), 'contact', 'other'. "
        "Keys: intent, confidence (0-1), user_goal, "
        "steps (array of {tool, objective, output} — only for pm_workflow, else []), "
        "risks (array), quick_win."
        if lang == "en"
        else "Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). "
        "Analyse l'intention et retourne uniquement du JSON strict. "
        "Valeurs d'intent : 'pm_workflow' (backlog/OKR/discovery/roadmap/epic/userStory), "
        "'portfolio' (profil/expérience/certifs de Carlin), "
        "'tech' (stack/architecture/questions techniques sur KRL1), 'contact', 'other'. "
        "Clés : intent, confidence (0-1), user_goal, "
        "steps (tableau {tool, objective, output} — seulement pour pm_workflow, sinon []), "
        "risks (tableau), quick_win."
    )

    history = normalize_history(state.get("history", []))[-8:]
    user_message = state.get("message", "")

    completion = llm.invoke([
        {"role": "system", "content": prompt},
        *history,
        {"role": "user", "content": user_message},
    ])

    raw = completion.content if isinstance(completion.content, str) else json.dumps(completion.content)
    plan = parse_planner_json(raw, lang=lang, user_message=user_message)

    return {"plan": plan}


def synthesis_node(state: GraphState) -> GraphState:
    lang = "en" if state.get("lang") == "en" else "fr"
    llm = get_llm(temperature=0.45)

    prompt = (
        "You are KRL1, Carlin Mankoto's portfolio assistant. "
        "For intent 'pm_workflow': transform the PM plan into an actionable answer with links to PM tools. "
        "For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal "
        "— do NOT mention PM tools unless genuinely relevant. "
        "Max 220 words. When citing a tool, use HTML link: "
        '<a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
        if lang == "en"
        else "Tu es KRL1, assistant portfolio de Carlin Mankoto. "
        "Pour l'intent 'pm_workflow' : transforme le plan PM en réponse actionnable avec liens vers les outils PM. "
        "Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal "
        "— ne cite pas les outils PM sauf si vraiment pertinent. "
        "Max 220 mots. Liens HTML cliquables si tu cites un outil : "
        '<a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.'
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
        "history": payload.history,
    }

    result = compiled_graph.invoke(state)
    return {
        "reply": result.get("reply", ""),
        "plan": result.get("plan"),
        "engine": "langgraph",
    }
