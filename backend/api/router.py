from fastapi import APIRouter

api_router = APIRouter()

@api_router.post("/ingest")
async def ingest_repository(repo_url: str):
    """
    Trigger the ingestion process for a GitHub repository.
    """
    # TODO: Implement repository cloning and analysis
    return {"status": "ingesting", "repo_url": repo_url}

@api_router.get("/graph/{repo_id}")
async def get_graph(repo_id: str):
    """
    Return the dependency and module graph data for the graph viewer.
    """
    # TODO: Fetch and return structured graph
    return {"repo_id": repo_id, "nodes": [], "edges": []}
