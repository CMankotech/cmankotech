from pathlib import Path
from typing import List, Tuple

KB_DIR = Path(__file__).parent / "knowledge_base"
CHUNK_WORDS = 300
CHUNK_OVERLAP = 50

_index = None
_docs: List[str] = []
_metas: List[dict] = []


def chunk_text(text: str) -> List[str]:
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i : i + CHUNK_WORDS]))
        i += CHUNK_WORDS - CHUNK_OVERLAP
    return [c for c in chunks if c.strip()]


def build_index():
    global _index, _docs, _metas
    if _index is not None:
        return _index

    from rank_bm25 import BM25Okapi

    for md_file in sorted(KB_DIR.glob("*.md")):
        content = md_file.read_text(encoding="utf-8")
        topic = md_file.stem
        for chunk in chunk_text(content):
            _docs.append(chunk)
            _metas.append({"source": md_file.name, "topic": topic})

    tokenized = [doc.lower().split() for doc in _docs]
    _index = BM25Okapi(tokenized)
    return _index


def retrieve(query: str, top_k: int = 3) -> List[Tuple[str, str, float]]:
    index = _index if _index is not None else build_index()
    if not _docs:
        return []

    scores = index.get_scores(query.lower().split())
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

    max_score = max((scores[i] for i in top_indices), default=1.0)
    results = []
    for i in top_indices:
        if scores[i] > 0 and max_score > 0:
            results.append((_docs[i], _metas[i]["source"], round(scores[i] / max_score, 4)))

    return results
