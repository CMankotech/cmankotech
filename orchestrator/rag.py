import os
from pathlib import Path
from typing import List, Tuple

KB_DIR = Path(__file__).parent / "knowledge_base"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
COLLECTION_NAME = "pm_knowledge"
CHUNK_WORDS = 300
CHUNK_OVERLAP = 50

_model = None
_collection = None


def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def chunk_text(text: str) -> List[str]:
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i : i + CHUNK_WORDS]))
        i += CHUNK_WORDS - CHUNK_OVERLAP
    return [c for c in chunks if c.strip()]


def build_index():
    global _collection
    import chromadb
    from chromadb.config import Settings

    client = chromadb.Client(Settings(anonymized_telemetry=False))
    _collection = client.get_or_create_collection(
        COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    if _collection.count() > 0:
        return _collection

    model = get_model()
    docs, ids, metadatas = [], [], []

    for md_file in sorted(KB_DIR.glob("*.md")):
        content = md_file.read_text(encoding="utf-8")
        topic = md_file.stem
        for i, chunk in enumerate(chunk_text(content)):
            docs.append(chunk)
            ids.append(f"{topic}_{i}")
            metadatas.append({"source": md_file.name, "topic": topic})

    if docs:
        embeddings = model.encode(docs, show_progress_bar=False).tolist()
        _collection.add(documents=docs, embeddings=embeddings, ids=ids, metadatas=metadatas)

    return _collection


def retrieve(query: str, top_k: int = 3) -> List[Tuple[str, str, float]]:
    collection = _collection if _collection is not None else build_index()
    model = get_model()

    query_embedding = model.encode([query], show_progress_bar=False).tolist()
    n = min(top_k, collection.count())
    if n == 0:
        return []

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )

    return [
        (doc, meta["source"], round(1 - dist, 4))
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]
