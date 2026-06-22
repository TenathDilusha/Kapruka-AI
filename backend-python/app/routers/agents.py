from fastapi import APIRouter

from app.agents.pipeline import process_message
from app.models.schemas import AgentRequest, AgentResponse

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/process", response_model=AgentResponse)
def process(req: AgentRequest) -> AgentResponse:
    return process_message(req)
