from fastapi import APIRouter

from app.agents.graph import run_agent_graph
from app.memory.store import get_memory
from app.models.schemas import AgentRequest, AgentResponse

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/process", response_model=AgentResponse)
async def process(req: AgentRequest) -> AgentResponse:
    return await run_agent_graph(req)


@router.get("/memory/{session_id}")
def get_session_memory(session_id: str) -> dict:
    return get_memory(session_id).summary()
