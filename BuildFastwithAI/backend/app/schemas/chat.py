from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.planner import (
    CitationItem,
    EligibilityDetail,
    DeadlineDetail,
    RequiredDocumentItem,
    ActionStepItem,
    ActionPlanResponse
)

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    document_id: Optional[str] = None
    conversation_id: Optional[str] = None
    language: Optional[str] = "en"
    user_context: Optional[dict] = Field(default_factory=dict, description="User demographic facts for eligibility")

class CitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    document_name: Optional[str] = None
    page_number: int
    snippet: str

class EligibilityResponse(BaseModel):
    status: str
    conditions_met: List[str]
    conditions_unmet: List[str]
    missing_info: List[str]
    summary: Optional[str] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    language: str
    confidence_score: float
    needs_verification: bool
    created_at: datetime
    citations: List[CitationResponse] = []
    eligibility: Optional[EligibilityResponse] = None
    action_plan: Optional[ActionPlanResponse] = None

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    document_id: Optional[str] = None
    created_at: datetime
    messages: List[MessageResponse] = []

class ConversationSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    document_id: Optional[str] = None
    created_at: datetime
    message_count: int = 0
