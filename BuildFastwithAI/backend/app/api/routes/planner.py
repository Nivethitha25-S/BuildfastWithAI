import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, engine
from app.models.user import User
from app.models.planner import Feedback
from app.schemas.planner import (
    FeedbackRequest,
    FeedbackResponse,
    EligibilityDetail,
    ActionPlanResponse,
    DeadlineDetail,
    ActionStepItem,
    RequiredDocumentItem
)
from app.schemas.chat import ChatRequest
from app.api.deps import get_current_user
from app.services.retrieval.vector_store import VectorStoreService
from app.services.llm.gemini_service import gemini_service

router = APIRouter(tags=["Planner & Feedback"])

@router.post("/eligibility/check", response_model=EligibilityDetail)
async def check_eligibility(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    vector_store = VectorStoreService.get_instance()
    retrieved_chunks = vector_store.retrieve_relevant_chunks(
        query=f"eligibility criteria qualifications age income requirements {request.question}",
        document_id=request.document_id,
        user_id=str(current_user.id),
        top_k=4
    )

    result = gemini_service.generate_grounded_response(
        question=f"Check eligibility: {request.question}",
        retrieved_chunks=retrieved_chunks,
        target_language=request.language or current_user.preferred_language or "en",
        user_context=request.user_context
    )

    if result.eligibility:
        return result.eligibility

    return EligibilityDetail(
        status="UNCERTAIN",
        missing_info=["Detailed scheme conditions not specified in available excerpts."]
    )

@router.post("/action-plan", response_model=ActionPlanResponse)
async def generate_action_plan(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    vector_store = VectorStoreService.get_instance()
    retrieved_chunks = vector_store.retrieve_relevant_chunks(
        query=f"application process deadline documents procedure steps {request.question}",
        document_id=request.document_id,
        user_id=str(current_user.id),
        top_k=4
    )

    result = gemini_service.generate_grounded_response(
        question=f"Generate step-by-step action plan, deadlines and required documents: {request.question}",
        retrieved_chunks=retrieved_chunks,
        target_language=request.language or current_user.preferred_language or "en",
        user_context=request.user_context
    )

    return ActionPlanResponse(
        steps=result.action_plan,
        deadline=result.deadline,
        required_documents=result.required_documents
    )

@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    fb = Feedback(
        id=str(uuid.uuid4()),
        message_id=request.message_id,
        user_id=current_user.id,
        rating=request.rating,
        comment=request.comment
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return fb

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "BharatSahay AI Backend",
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check():
    # Verify DB connectivity
    try:
        async with engine.connect() as conn:
            await conn.execute(select(1))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Verify Vector store
    try:
        VectorStoreService.get_instance()
        vector_status = "ready"
    except Exception as e:
        vector_status = f"unhealthy: {str(e)}"

    return {
        "status": "ready" if db_status == "connected" and vector_status == "ready" else "degraded",
        "database": db_status,
        "vector_store": vector_status
    }
