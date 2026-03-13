from fastapi.testclient import TestClient

import app as orchestrator_app


class DummyResponse:
    def __init__(self, content):
        self.content = content


class DummyLLM:
    def __init__(self, outputs):
        self._outputs = outputs

    def invoke(self, _messages):
        return DummyResponse(self._outputs.pop(0))


def test_normalize_history_filters_bad_items():
    history = [
        {"role": "user", "content": "  hello  "},
        {"role": "tool", "content": "invalid role"},
        {"role": "assistant", "content": "   "},
        {"role": "system", "content": "ok"},
        "bad",
    ]
    result = orchestrator_app.normalize_history(history)
    assert result == [
        {"role": "user", "content": "hello"},
        {"role": "system", "content": "ok"},
    ]


def test_orchestrate_success(monkeypatch):
    outputs = [
        '{"intent":"roadmap","confidence":0.91,"user_goal":"Build roadmap","steps":[{"tool":"Roadmap Storyteller","objective":"Pitch","output":"Narrative"}],"risks":["scope"],"quick_win":"Run Storyteller"}',
        "Commence par Discovery Assistant puis Roadmap Storyteller.",
    ]

    monkeypatch.setattr(orchestrator_app, "get_llm", lambda temperature=0.3: DummyLLM(outputs))

    client = TestClient(orchestrator_app.app)
    res = client.post(
        "/orchestrate",
        json={
            "lang": "fr",
            "message": "Aide-moi à structurer ma roadmap",
            "history": [{"role": "user", "content": "Contexte B2B"}],
        },
    )

    assert res.status_code == 200
    data = res.json()
    assert data["engine"] == "langgraph"
    assert data["plan"]["intent"] == "roadmap"
    assert "Roadmap Storyteller" in data["reply"]


def test_orchestrate_planner_invalid_json_fallback(monkeypatch):
    outputs = [
        "not-json",
        "Réponse quand même utile.",
    ]

    monkeypatch.setattr(orchestrator_app, "get_llm", lambda temperature=0.3: DummyLLM(outputs))

    client = TestClient(orchestrator_app.app)
    res = client.post(
        "/orchestrate",
        json={"lang": "fr", "message": "Prioriser backlog", "history": []},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["plan"]["intent"] == "unknown"
    assert "planner_json_parse_error" in data["plan"]["risks"]
