from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class CitationItem(BaseModel):
    document_name: str
    page_number: int
    snippet: str

class RequiredDocumentItem(BaseModel):
    name: str
    mandatory: bool = True
    purpose: Optional[str] = None

class ActionStepItem(BaseModel):
    step_number: int
    title: str
    description: str
    portal_or_url: Optional[str] = None

class EligibilityDetail(BaseModel):
    status: str = Field(description="ELIGIBLE, NOT_ELIGIBLE, or UNCERTAIN")
    conditions_met: List[str] = Field(default_factory=list)
    conditions_unmet: List[str] = Field(default_factory=list)
    missing_info: List[str] = Field(default_factory=list)
    summary: Optional[str] = None

class DeadlineDetail(BaseModel):
    date_text: Optional[str] = None
    is_deadline_found: bool = False
    source_page: Optional[int] = None
    description: Optional[str] = None

class ActionPlanResponse(BaseModel):
    steps: List[ActionStepItem]
    deadline: Optional[DeadlineDetail] = None
    required_documents: List[RequiredDocumentItem] = []

class GroundedRAGResult(BaseModel):
    answer: str = Field(description="Clear, grounded answer in the requested Indian language or English")
    citations: List[CitationItem] = Field(default_factory=list)
    eligibility: Optional[EligibilityDetail] = None
    required_documents: List[RequiredDocumentItem] = Field(default_factory=list)
    deadline: Optional[DeadlineDetail] = None
    action_plan: List[ActionStepItem] = Field(default_factory=list)
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    needs_verification: bool = False
    verification_reason: Optional[str] = None

class FeedbackRequest(BaseModel):
    message_id: str
    rating: int = Field(..., description="1 for helpful, -1 for not helpful")
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    message_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime
